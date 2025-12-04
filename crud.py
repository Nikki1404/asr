from sqlalchemy.orm import Session
from models import BlogPost, BenchmarkResult, DashboardData
from schemas import BlogPostCreate
import json

def create_blog_post(db: Session, post: BlogPostCreate):
    # Convert Pydantic models to dict for JSON storage
    benchmark_data = None
    if post.benchmark_data:
        benchmark_data = [item.model_dump() for item in post.benchmark_data]
    
    model_performance_data = None
    if post.model_performance_data:
        model_performance_data = [item.model_dump() for item in post.model_performance_data]
    
    db_post = BlogPost(
        title=post.title,
        author=post.author,
        excerpt=post.excerpt,
        content=post.content,
        benchmark_data=benchmark_data,
        model_performance_data=model_performance_data
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def get_blog_posts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(BlogPost).offset(skip).limit(limit).all()

def get_blog_post(db: Session, post_id: str):
    return db.query(BlogPost).filter(BlogPost.id == post_id).first()

def create_benchmark_result(db: Session, model: str, wer: float, dataset: str):
    db_result = BenchmarkResult(model=model, wer=wer, dataset=dataset)
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def get_benchmark_results(db: Session):
    return db.query(BenchmarkResult).all()

def create_dashboard_data(db: Session, data: dict):
    db_data = DashboardData(**data)
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

def get_dashboard_data(db: Session):
    return db.query(DashboardData).all()