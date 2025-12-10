"""
Provider Level Service
Calculates and updates provider levels based on ratings
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import ServiceProvider, Rating


class ProviderLevelService:
    """Service for managing provider levels based on ratings"""
    
    LEVELS = {
        "beginner": {
            "name": "Beginner",
            "min_rating": 0.0,
            "max_rating": 2.99,
            "color": "gray",
            "icon": "🌱"
        },
        "skilled": {
            "name": "Skilled",
            "min_rating": 3.0,
            "max_rating": 3.99,
            "color": "blue",
            "icon": "⭐"
        },
        "expert": {
            "name": "Expert",
            "min_rating": 4.0,
            "max_rating": 5.0,
            "color": "purple",
            "icon": "👑"
        }
    }
    
    @staticmethod
    def calculate_level(average_rating: float) -> str:
        """
        Calculate provider level based on average rating
        
        Rules:
        - Beginner: < 3.0 (default for new providers)
        - Skilled: >= 3.0 and < 4.0
        - Expert: >= 4.0
        
        Args:
            average_rating: Average rating value (0.0 to 5.0)
            
        Returns:
            Level string: "beginner", "skilled", or "expert"
        """
        if average_rating >= 4.0:
            return "expert"
        elif average_rating >= 3.0:
            return "skilled"
        else:
            return "beginner"
    
    @staticmethod
    def get_provider_average_rating(provider_id: int, db: Session) -> float:
        """
        Get average rating for a provider
        
        Args:
            provider_id: ID of the provider
            db: Database session
            
        Returns:
            Average rating (0.0 if no ratings)
        """
        result = db.query(
            func.avg(Rating.rating).label('average')
        ).filter(
            Rating.provider_id == provider_id
        ).first()
        
        return float(result.average or 0.0)
    
    @staticmethod
    def update_provider_level(provider_id: int, db: Session) -> Optional[str]:
        """
        Calculate and update provider level based on current ratings
        
        Args:
            provider_id: ID of the provider
            db: Database session
            
        Returns:
            Updated level string or None if provider not found
        """
        provider = db.query(ServiceProvider).filter(
            ServiceProvider.id == provider_id
        ).first()
        
        if not provider:
            return None
        
        # Get average rating
        average_rating = ProviderLevelService.get_provider_average_rating(provider_id, db)
        
        # Calculate level
        new_level = ProviderLevelService.calculate_level(average_rating)
        
        # Update provider level
        provider.level = new_level
        db.commit()
        db.refresh(provider)
        
        return new_level
    
    @staticmethod
    def get_level_info(level: str) -> dict:
        """
        Get level information (name, color, icon)
        
        Args:
            level: Level string ("beginner", "skilled", "expert")
            
        Returns:
            Dictionary with level information
        """
        return ProviderLevelService.LEVELS.get(level, ProviderLevelService.LEVELS["beginner"])

