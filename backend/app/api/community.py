from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from app.db.database import get_db
from app.models.post import Post, Comment, Tag, PostTag, PostMention, CommentMention
from app.models.user import User
from app.schemas.post import (
    PostCreate, PostUpdate, PostResponse, PostListResponse,
    CommentCreate, CommentUpdate, CommentResponse
)
from app.core.security import verify_token
from typing import List, Optional
from datetime import datetime
import re
import traceback
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/community", tags=["community"])

def extract_mentions(text: str) -> List[str]:
    """텍스트에서 @mention 패턴 추출 (이메일 형식 및 사용자 이름 형식)"""
    # @email 형식 찾기
    email_pattern = r'@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
    email_matches = re.findall(email_pattern, text)
    
    # @username 형식 찾기 (이메일 형식이 아닌 것만)
    name_pattern = r'@([a-zA-Z0-9_]+)'
    name_matches = re.findall(name_pattern, text)
    # 이메일 형식이 아닌 것만 필터링
    name_matches = [name for name in name_matches if '@' not in name]
    
    return list(set(email_matches + name_matches))

def extract_tags(text: str) -> List[str]:
    """텍스트에서 #tag 패턴 추출"""
    pattern = r'#(\w+)'
    matches = re.findall(pattern, text)
    return [tag.lower() for tag in set(matches)]

@router.get("/posts", response_model=PostListResponse)
async def get_posts(
    post_type: Optional[str] = Query(None, description="Filter by post type: notice, forum, request"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    token: Optional[str] = Query(None, description="User authentication token"),
    db: Session = Depends(get_db)
):
    """게시글 목록 조회 (검색 및 필터링 지원)"""
    try:
        query = db.query(Post)
        
        # 타입 필터
        if post_type:
            query = query.filter(Post.post_type == post_type)
        
        # 태그 필터
        if tag:
            tag_obj = db.query(Tag).filter(Tag.name == tag.lower()).first()
            if tag_obj:
                query = query.join(PostTag).filter(PostTag.tag_id == tag_obj.id)
            else:
                # 태그가 없으면 빈 결과 반환
                return PostListResponse(posts=[], total=0, page=page, page_size=page_size)
        
        # 검색 필터
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Post.title.ilike(search_term),
                    Post.content.ilike(search_term)
                )
            )
        
        # 정렬: 고정 게시글 먼저, 그 다음 최신순
        query = query.order_by(desc(Post.is_pinned), desc(Post.created_at))
        
        # 전체 개수
        total = query.count()
        
        # 페이지네이션
        offset = (page - 1) * page_size
        posts = query.offset(offset).limit(page_size).all()
        
        # 댓글 개수 및 좋아요 정보 추가
        from app.models.post import PostLike
        from app.core.security import verify_token
        post_responses = []
        current_user_id = None
        if token:
            try:
                payload = verify_token(token)
                if payload:
                    user_id = payload.get("sub")
                    if user_id:
                        current_user_id = int(user_id)
            except:
                pass
        
        for post in posts:
            comment_count = db.query(Comment).filter(Comment.post_id == post.id).count()
            tags = [{"id": pt.tag.id, "name": pt.tag.name} for pt in post.tags]
            mentions = [{"mentioned_email": pm.mentioned_email, "mentioned_name": pm.mentioned_name} for pm in post.mentions]
            
            # 좋아요 수 및 현재 사용자가 좋아요를 눌렀는지 확인
            like_count = db.query(PostLike).filter(PostLike.post_id == post.id).count()
            is_liked = False
            if current_user_id:
                existing_like = db.query(PostLike).filter(
                    PostLike.post_id == post.id,
                    PostLike.user_id == current_user_id
                ).first()
                is_liked = existing_like is not None
            
            # Notice 타입인 경우 작성자명을 'Global Partnership Center'로 표시
            author_name = post.author_name
            if post.post_type == "notice":
                author_name = "Global Partnership Center"
            
            try:
                post_dict = {
                    "id": post.id,
                    "post_type": post.post_type,
                    "title": post.title,
                    "content": post.content,
                    "author_email": post.author_email,
                    "author_name": author_name,
                    "is_pinned": post.is_pinned,
                    "view_count": post.view_count,
                    "image_url": post.image_url,
                    "like_count": like_count,
                    "is_liked": is_liked,
                    "is_resolved": getattr(post, 'is_resolved', False),
                    "created_at": post.created_at,
                    "updated_at": post.updated_at,
                    "comment_count": comment_count,
                    "tags": tags,
                    "mentions": mentions
                }
                post_responses.append(PostResponse(**post_dict))
            except Exception as e:
                error_msg = f"Error creating PostResponse for post {post.id}: {e}"
                logger.error(error_msg)
                logger.error(traceback.format_exc())
                print(error_msg)
                print(traceback.format_exc())
                raise
        
        return PostListResponse(
            posts=post_responses,
            total=total,
            page=page,
            page_size=page_size
        )
    except Exception as e:
        error_msg = f"Error in get_posts: {e}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        raise

@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    token: Optional[str] = Query(None, description="User authentication token"),
    db: Session = Depends(get_db)
):
    """게시글 상세 조회"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # 조회수 증가
    post.view_count += 1
    db.commit()
    db.refresh(post)
    
    comment_count = db.query(Comment).filter(Comment.post_id == post.id).count()
    tags = [{"id": pt.tag.id, "name": pt.tag.name} for pt in post.tags]
    mentions = [{"mentioned_email": pm.mentioned_email, "mentioned_name": pm.mentioned_name} for pm in post.mentions]
    
    # 좋아요 수 및 현재 사용자가 좋아요를 눌렀는지 확인
    from app.models.post import PostLike
    like_count = db.query(PostLike).filter(PostLike.post_id == post.id).count()
    is_liked = False
    if token:
        try:
            payload = verify_token(token)
            if payload:
                user_id = payload.get("sub")
                if user_id:
                    user_id_int = int(user_id)
                    existing_like = db.query(PostLike).filter(
                        PostLike.post_id == post.id,
                        PostLike.user_id == user_id_int
                    ).first()
                    is_liked = existing_like is not None
        except:
            pass
    
    # Notice 타입인 경우 작성자명을 'Global Partnership Center'로 표시
    author_name = post.author_name
    if post.post_type == "notice":
        author_name = "Global Partnership Center"
    
    post_dict = {
        "id": post.id,
        "post_type": post.post_type,
        "title": post.title,
        "content": post.content,
        "author_email": post.author_email,
        "author_name": author_name,
        "is_pinned": post.is_pinned,
        "view_count": post.view_count,
        "image_url": post.image_url,
        "like_count": like_count,
        "is_liked": is_liked,
        "is_resolved": getattr(post, 'is_resolved', False),
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "comment_count": comment_count,
        "tags": tags,
        "mentions": mentions
    }
    return PostResponse(**post_dict)

@router.post("/posts", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    token: str = Query(..., description="User authentication token"),
    db: Session = Depends(get_db)
):
    """게시글 생성"""
    # JWT 토큰 검증
    from app.core.security import verify_token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    try:
        user_id_int = int(user_id)
        user = db.query(User).filter(User.id == user_id_int).first()
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Notice는 관리자만 작성 가능
    author_email = user.email
    author_name = user.name
    author_id = user.id
    
    if post.post_type == "notice":
        from app.core.admin_auth import verify_admin_token
        from app.models.admin import Admin
        # 토큰이 관리자 토큰인지 확인
        admin_payload = verify_admin_token(token)
        print(f"[NOTICE CREATE] Admin payload: {admin_payload}")
        if admin_payload:
            # 관리자 토큰인 경우, 관리자 정보 사용
            admin_id_token = admin_payload.get("sub")
            print(f"[NOTICE CREATE] Admin ID from token: {admin_id_token}")
            admin = db.query(Admin).filter(Admin.id == int(admin_id_token)).first()
            if not admin:
                print(f"[NOTICE CREATE] Admin not found for ID: {admin_id_token}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Admin not found"
                )
            print(f"[NOTICE CREATE] Found admin: {admin.username}, email: {admin.email}")
            # 관리자 이메일로 사용자 찾기
            admin_user = db.query(User).filter(User.email == admin.email).first()
            if admin_user:
                author_id = admin_user.id
                author_email = admin_user.email
                author_name = "Global Partnership Center"  # 관리자가 작성한 Notice는 항상 'Global Partnership Center'로 표시
                print(f"[NOTICE CREATE] Using admin user: {author_email}")
            else:
                # 관리자 이메일로 사용자가 없으면 관리자 정보 사용
                # 관리자 이메일이 없으면 사용자명을 기반으로 이메일 생성
                if admin.email:
                    author_email = admin.email
                else:
                    # 관리자 이메일이 없으면 기본 이메일 형식 사용
                    author_email = f"{admin.username}@admin.local"
                author_name = "Global Partnership Center"  # 관리자가 작성한 Notice는 항상 'Global Partnership Center'로 표시
                # 기존 사용자 ID 사용 (또는 관리자용 더미 사용자 생성)
                author_id = user.id
                print(f"[NOTICE CREATE] Using admin info directly: {author_email}")
        else:
            # 일반 사용자 토큰인 경우, 이메일로 관리자 확인
            print(f"[NOTICE CREATE] Not admin token, checking user email: {user.email}")
            admin = db.query(Admin).filter(Admin.email == user.email).first()
            if not admin:
                print(f"[NOTICE CREATE] User {user.email} is not an admin")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only admins can create notice posts"
                )
            print(f"[NOTICE CREATE] User {user.email} is an admin")
            # 관리자가 작성한 Notice는 항상 'Global Partnership Center'로 표시
            author_name = "Global Partnership Center"
    
    # 게시글 생성
    db_post = Post(
        post_type=post.post_type,
        title=post.title,
        content=post.content,
        author_id=author_id,
        author_email=author_email,
        author_name=author_name
    )
    db.add(db_post)
    db.flush()
    
    # 태그 처리
    if post.tags:
        for tag_name in post.tags:
            tag = db.query(Tag).filter(Tag.name == tag_name.lower()).first()
            if not tag:
                tag = Tag(name=tag_name.lower())
                db.add(tag)
                db.flush()
            
            post_tag = PostTag(post_id=db_post.id, tag_id=tag.id)
            db.add(post_tag)
    
    # 언급 처리 (content에서도 추출)
    mentions_from_content = extract_mentions(post.content)
    all_mentions = list(set((post.mentions or []) + mentions_from_content))
    
    for mention_text in all_mentions:
        # 이메일 형식인지 확인
        if '@' in mention_text and '.' in mention_text.split('@')[1]:
            # 이메일 형식
            email = mention_text
            mentioned_user = db.query(User).filter(User.email == email).first()
        else:
            # 사용자 이름 형식 (언더스코어를 공백으로 변환)
            name = mention_text.replace('_', ' ')
            mentioned_user = db.query(User).filter(User.name == name).first()
            if not mentioned_user:
                # 이름으로 찾지 못하면 이메일의 앞부분으로도 시도
                mentioned_user = db.query(User).filter(User.email.like(f"{mention_text}@%")).first()
            email = mentioned_user.email if mentioned_user else None
        
        if email:
            mention = PostMention(
                post_id=db_post.id,
                mentioned_email=email,
                mentioned_name=mentioned_user.name if mentioned_user else None
            )
            db.add(mention)
    
    db.commit()
    db.refresh(db_post)
    
    comment_count = 0
    tags = [{"id": pt.tag.id, "name": pt.tag.name} for pt in db_post.tags]
    mentions = [{"mentioned_email": pm.mentioned_email, "mentioned_name": pm.mentioned_name} for pm in db_post.mentions]
    
    post_dict = {
        "id": db_post.id,
        "post_type": db_post.post_type,
        "title": db_post.title,
        "content": db_post.content,
        "author_email": db_post.author_email,
        "author_name": db_post.author_name,
        "is_pinned": db_post.is_pinned,
        "view_count": db_post.view_count,
        "image_url": db_post.image_url,
        "like_count": db_post.like_count or 0,
        "is_liked": False,
        "created_at": db_post.created_at,
        "updated_at": db_post.updated_at,
        "comment_count": comment_count,
        "tags": tags,
        "mentions": mentions
    }
    return PostResponse(**post_dict)

@router.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post: PostUpdate,
    token: str = Query(..., description="User authentication token"),
    db: Session = Depends(get_db)
):
    """게시글 수정"""
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # JWT 토큰 검증
    from app.core.security import verify_token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    try:
        user_id_int = int(user_id)
        user = db.query(User).filter(User.id == user_id_int).first()
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    
    # 작성자 확인 또는 관리자 권한 확인
    is_admin = False
    if db_post.post_type == "notice":
        from app.core.admin_auth import verify_admin_token
        from app.models.admin import Admin
        admin_payload = verify_admin_token(token)
        if admin_payload:
            admin_id_token = admin_payload.get("sub")
            admin = db.query(Admin).filter(Admin.id == int(admin_id_token)).first()
            if admin:
                is_admin = True
    
    if not user or (db_post.author_id != user.id and not is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post"
        )
    
    # 업데이트
    if post.title is not None:
        db_post.title = post.title
    if post.content is not None:
        db_post.content = post.content
    if post.is_pinned is not None:
        db_post.is_pinned = post.is_pinned
    if post.is_resolved is not None:
        # Request 타입만 is_resolved 업데이트 가능
        if db_post.post_type == "request":
            db_post.is_resolved = post.is_resolved
    
    # 태그 업데이트
    if post.tags is not None:
        # 기존 태그 삭제
        db.query(PostTag).filter(PostTag.post_id == post_id).delete()
        
        # 새 태그 추가
        for tag_name in post.tags:
            tag = db.query(Tag).filter(Tag.name == tag_name.lower()).first()
            if not tag:
                tag = Tag(name=tag_name.lower())
                db.add(tag)
                db.flush()
            
            post_tag = PostTag(post_id=post_id, tag_id=tag.id)
            db.add(post_tag)
    
    # 언급 업데이트
    if post.mentions is not None or post.content:
        # 기존 언급 삭제
        db.query(PostMention).filter(PostMention.post_id == post_id).delete()
        
        # 새 언급 추가
        mentions_from_content = extract_mentions(post.content or db_post.content)
        all_mentions = list(set((post.mentions or []) + mentions_from_content))
        
        for mention_text in all_mentions:
            # 이메일 형식인지 확인
            if '@' in mention_text and '.' in mention_text.split('@')[1]:
                # 이메일 형식
                email = mention_text
                mentioned_user = db.query(User).filter(User.email == email).first()
            else:
                # 사용자 이름 형식 (언더스코어를 공백으로 변환)
                name = mention_text.replace('_', ' ')
                mentioned_user = db.query(User).filter(User.name == name).first()
                if not mentioned_user:
                    # 이름으로 찾지 못하면 이메일의 앞부분으로도 시도
                    mentioned_user = db.query(User).filter(User.email.like(f"{mention_text}@%")).first()
                email = mentioned_user.email if mentioned_user else None
            
            if email:
                mention = PostMention(
                    post_id=post_id,
                    mentioned_email=email,
                    mentioned_name=mentioned_user.name if mentioned_user else None
                )
                db.add(mention)
    
    db.commit()
    db.refresh(db_post)
    
    comment_count = db.query(Comment).filter(Comment.post_id == post_id).count()
    tags = [{"id": pt.tag.id, "name": pt.tag.name} for pt in db_post.tags]
    mentions = [{"mentioned_email": pm.mentioned_email, "mentioned_name": pm.mentioned_name} for pm in db_post.mentions]
    
    # 좋아요 수 및 현재 사용자가 좋아요를 눌렀는지 확인
    from app.models.post import PostLike
    like_count = db.query(PostLike).filter(PostLike.post_id == post_id).count()
    is_liked = False
    if token:
        try:
            payload = verify_token(token)
            if payload:
                user_id = payload.get("sub")
                if user_id:
                    user_id_int = int(user_id)
                    existing_like = db.query(PostLike).filter(
                        PostLike.post_id == post_id,
                        PostLike.user_id == user_id_int
                    ).first()
                    is_liked = existing_like is not None
        except:
            pass
    
    post_dict = {
        "id": db_post.id,
        "post_type": db_post.post_type,
        "title": db_post.title,
        "content": db_post.content,
        "author_email": db_post.author_email,
        "author_name": db_post.author_name,
        "is_pinned": db_post.is_pinned,
        "view_count": db_post.view_count,
        "image_url": db_post.image_url,
            "like_count": like_count,
            "is_liked": is_liked,
            "created_at": db_post.created_at,
        "updated_at": db_post.updated_at,
        "comment_count": comment_count,
        "tags": tags,
        "mentions": mentions
    }
    return PostResponse(**post_dict)

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    token: str = Query(..., description="User authentication token"),
    db: Session = Depends(get_db)
):
    """게시글 삭제"""
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # JWT 토큰 검증
    from app.core.security import verify_token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    try:
        user_id_int = int(user_id)
        user = db.query(User).filter(User.id == user_id_int).first()
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # 작성자 확인 또는 관리자 권한 확인
    is_admin = False
    if db_post.post_type == "notice":
        from app.core.admin_auth import verify_admin_token
        from app.models.admin import Admin
        admin_payload = verify_admin_token(token)
        if admin_payload:
            admin_id_token = admin_payload.get("sub")
            admin = db.query(Admin).filter(Admin.id == int(admin_id_token)).first()
            if admin:
                is_admin = True
        else:
            # 일반 사용자 토큰인 경우, 이메일로 관리자 확인
            admin = db.query(Admin).filter(Admin.email == user.email).first()
            if admin:
                is_admin = True
    else:
        # Notice가 아닌 경우, 작성자만 삭제 가능
        pass
    
    if db_post.author_id != user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )
    
    db.delete(db_post)
    db.commit()
    return {"message": "Post deleted successfully"}

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    post_id: int,
    db: Session = Depends(get_db)
):
    """게시글의 댓글 목록 조회"""
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
    
    comment_responses = []
    for comment in comments:
        mentions = [{"mentioned_email": cm.mentioned_email, "mentioned_name": cm.mentioned_name} for cm in comment.mentions]
        comment_dict = {
            **comment.__dict__,
            "mentions": mentions
        }
        comment_responses.append(CommentResponse(**comment_dict))
    
    return comment_responses

@router.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: int,
    token: str = Query(..., description="User authentication token"),
    db: Session = Depends(get_db)
):
    """게시글 좋아요 토글"""
    from app.core.security import verify_token
    from app.models.post import PostLike
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    
    # 게시글 확인
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # 기존 좋아요 확인
    existing_like = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == user_id_int
    ).first()
    
    if existing_like:
        # 좋아요 취소
        db.delete(existing_like)
        db.commit()
        return {"liked": False, "like_count": db.query(PostLike).filter(PostLike.post_id == post_id).count()}
    else:
        # 좋아요 추가
        new_like = PostLike(post_id=post_id, user_id=user_id_int)
        db.add(new_like)
        db.commit()
        return {"liked": True, "like_count": db.query(PostLike).filter(PostLike.post_id == post_id).count()}

@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(
    post_id: int,
    comment: CommentCreate,
    token: str = Query(..., description="User authentication token"),
    db: Session = Depends(get_db)
):
    """댓글 생성"""
    # 게시글 확인
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # JWT 토큰 검증
    from app.core.security import verify_token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    try:
        user_id_int = int(user_id)
        user = db.query(User).filter(User.id == user_id_int).first()
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # 댓글 생성
    db_comment = Comment(
        post_id=post_id,
        content=comment.content,
        author_id=user.id,
        author_email=user.email,
        author_name=user.name,
        parent_id=comment.parent_id
    )
    db.add(db_comment)
    db.flush()
    
    # 언급 처리
    mentions_from_content = extract_mentions(comment.content)
    all_mentions = list(set((comment.mentions or []) + mentions_from_content))
    
    for mention_text in all_mentions:
        # 이메일 형식인지 확인
        if '@' in mention_text and '.' in mention_text.split('@')[1]:
            # 이메일 형식
            email = mention_text
            mentioned_user = db.query(User).filter(User.email == email).first()
        else:
            # 사용자 이름 형식 (언더스코어를 공백으로 변환)
            name = mention_text.replace('_', ' ')
            mentioned_user = db.query(User).filter(User.name == name).first()
            if not mentioned_user:
                # 이름으로 찾지 못하면 이메일의 앞부분으로도 시도
                mentioned_user = db.query(User).filter(User.email.like(f"{mention_text}@%")).first()
            email = mentioned_user.email if mentioned_user else None
        
        if email:
            mention = CommentMention(
                comment_id=db_comment.id,
                mentioned_email=email,
                mentioned_name=mentioned_user.name if mentioned_user else None
            )
            db.add(mention)
    
    db.commit()
    db.refresh(db_comment)
    
    mentions = [{"mentioned_email": cm.mentioned_email, "mentioned_name": cm.mentioned_name} for cm in db_comment.mentions]
    comment_dict = {
        **db_comment.__dict__,
        "mentions": mentions
    }
    return CommentResponse(**comment_dict)

@router.get("/tags", response_model=List[dict])
async def get_tags(
    db: Session = Depends(get_db)
):
    """인기 태그 목록 조회"""
    tags = db.query(
        Tag.id,
        Tag.name,
        func.count(PostTag.post_id).label("post_count")
    ).join(PostTag).group_by(Tag.id, Tag.name).order_by(desc("post_count")).limit(50).all()
    
    return [{"id": tag.id, "name": tag.name, "post_count": tag.post_count} for tag in tags]

@router.get("/popular-posts", response_model=List[PostResponse])
async def get_popular_posts(
    limit: int = Query(3, ge=1, le=20, description="Number of popular posts to return"),
    token: Optional[str] = Query(None, description="User authentication token"),
    db: Session = Depends(get_db)
):
    """인기 게시글 목록 조회 (좋아요 수 기준, Forum 타입만)"""
    from app.models.post import PostLike
    from app.core.security import verify_token
    
    # Forum 타입만 필터링하고 좋아요 수 기준으로 정렬 (좋아요 수가 많은 순, 같으면 최신순)
    posts = db.query(Post).filter(
        Post.post_type == 'forum'
    ).outerjoin(
        PostLike, Post.id == PostLike.post_id
    ).group_by(Post.id).order_by(
        desc(func.count(PostLike.post_id)), desc(Post.created_at)
    ).limit(limit).all()
    
    post_responses = []
    current_user_id = None
    if token:
        try:
            payload = verify_token(token)
            if payload:
                user_id = payload.get("sub")
                if user_id:
                    current_user_id = int(user_id)
        except:
            pass
    
    for post in posts:
        comment_count = db.query(Comment).filter(Comment.post_id == post.id).count()
        tags = [{"id": pt.tag.id, "name": pt.tag.name} for pt in post.tags]
        mentions = [{"mentioned_email": pm.mentioned_email, "mentioned_name": pm.mentioned_name} for pm in post.mentions]
        
        # 좋아요 수 계산
        like_count = db.query(PostLike).filter(PostLike.post_id == post.id).count()
        
        # 현재 사용자가 좋아요를 눌렀는지 확인
        is_liked = False
        if current_user_id:
            existing_like = db.query(PostLike).filter(
                PostLike.post_id == post.id,
                PostLike.user_id == current_user_id
            ).first()
            is_liked = existing_like is not None
        
        post_dict = {
            "id": post.id,
            "post_type": post.post_type,
            "title": post.title,
            "content": post.content,
            "author_email": post.author_email,
            "author_name": post.author_name,
            "is_pinned": post.is_pinned,
            "view_count": post.view_count,
            "image_url": post.image_url,
            "like_count": like_count,
            "is_liked": is_liked,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "comment_count": comment_count,
            "tags": tags,
            "mentions": mentions
        }
        post_responses.append(PostResponse(**post_dict))
    
    return post_responses

@router.get("/users", response_model=List[dict])
async def get_users(
    search: Optional[str] = Query(None, description="Search users by name or email"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of users to return"),
    token: Optional[str] = Query(None, description="User authentication token"),
    db: Session = Depends(get_db)
):
    """사용자 목록 조회 (멘션 자동완성용)"""
    # 토큰 검증 (선택적)
    current_user_id = None
    if token:
        try:
            payload = verify_token(token)
            if payload:
                user_id = payload.get("sub")
                if user_id:
                    current_user_id = int(user_id)
        except:
            pass
    
    # 사용자 쿼리
    query = db.query(User).filter(User.is_active == True)
    
    # 검색어가 있으면 이름이나 이메일로 필터링
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
    
    # 활성 사용자만, 이름 순으로 정렬
    users = query.order_by(User.name).limit(limit).all()
    
    # 응답 형식: {email, name, picture}
    return [
        {
            "email": user.email,
            "name": user.name,
            "picture": user.picture
        }
        for user in users
    ]

@router.get("/mentioned-posts", response_model=PostListResponse)
async def get_mentioned_posts(
    token: str = Query(..., description="User authentication token"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """현재 사용자가 멘션된 게시글 목록 조회"""
    # 토큰 검증
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    # 현재 사용자 정보 가져오기
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 현재 사용자가 멘션된 게시글 조회 (중복 제거, 모든 게시글 포함)
    # distinct()와 group_by를 사용하여 중복 완전 제거
    mentioned_post_ids = db.query(PostMention.post_id).filter(
        PostMention.mentioned_email == user.email
    ).distinct().all()
    
    # Set을 사용하여 중복 완전 제거
    mentioned_post_ids_set = set([row[0] for row in mentioned_post_ids])
    mentioned_post_ids_list = list(mentioned_post_ids_set)
    
    if not mentioned_post_ids_list:
        mentioned_posts = []
    else:
        # Post를 조회하고 Set을 사용하여 중복 완전 제거
        all_posts = db.query(Post).filter(
            Post.id.in_(mentioned_post_ids_list)
        ).order_by(desc(Post.created_at)).all()
        
        # 추가 안전장치: Set을 사용하여 중복 완전 제거
        seen_ids = set()
        unique_posts = []
        for post in all_posts:
            if post.id not in seen_ids:
                seen_ids.add(post.id)
                unique_posts.append(post)
        mentioned_posts = unique_posts
    
    # 페이지네이션
    total = len(mentioned_posts)
    start = (page - 1) * page_size
    end = start + page_size
    posts = mentioned_posts[start:end]
    
    # 응답 형식 구성
    from app.models.post import PostLike
    post_responses = []
    seen_post_ids = set()  # 응답에서도 중복 제거
    
    for post in posts:
        # 이미 처리한 post_id는 건너뛰기
        if post.id in seen_post_ids:
            continue
        seen_post_ids.add(post.id)
        
        comment_count = db.query(Comment).filter(Comment.post_id == post.id).count()
        tags = [{"id": pt.tag.id, "name": pt.tag.name} for pt in post.tags]
        mentions = [{"mentioned_email": pm.mentioned_email, "mentioned_name": pm.mentioned_name} for pm in post.mentions]
        
        # 좋아요 수 계산
        like_count = db.query(PostLike).filter(PostLike.post_id == post.id).count()
        
        # 현재 사용자가 좋아요를 눌렀는지 확인
        existing_like = db.query(PostLike).filter(
            PostLike.post_id == post.id,
            PostLike.user_id == int(user_id)
        ).first()
        is_liked = existing_like is not None
        
        post_dict = {
            "id": post.id,
            "post_type": post.post_type,
            "title": post.title,
            "content": post.content,
            "author_email": post.author_email,
            "author_name": post.author_name,
            "is_pinned": post.is_pinned,
            "view_count": post.view_count,
            "image_url": post.image_url,
            "like_count": like_count,
            "is_liked": is_liked,
            "is_resolved": getattr(post, 'is_resolved', False),
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "comment_count": comment_count,
            "tags": tags,
            "mentions": mentions
        }
        post_responses.append(PostResponse(**post_dict))
    
    return PostListResponse(
        posts=post_responses,
        total=total,
        page=page,
        page_size=page_size
    )
