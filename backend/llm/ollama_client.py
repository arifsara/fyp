"""
Ollama API client for embeddings and LLM generation
Supports nomic-embed-text (embeddings) and Llama 3.1 (generation)
"""
import httpx
import os
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.1")


class OllamaClient:
    """Client for interacting with Ollama API"""
    
    def __init__(self, base_url: str = OLLAMA_BASE_URL):
        self.base_url = base_url
        self.embedding_model = EMBEDDING_MODEL
        self.llm_model = LLM_MODEL
        self.timeout = 60.0  # 1 minute timeout for LLM calls (reduced for faster responses)
    
    async def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for text using nomic-embed-text
        
        Args:
            text: Input text to embed
            
        Returns:
            List of floats representing the embedding vector (1536 dimensions)
            
        Raises:
            httpx.HTTPError: If API call fails
        """
        url = f"{self.base_url}/api/embeddings"
        
        payload = {
            "model": self.embedding_model,
            "prompt": text
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                if "embedding" not in data:
                    raise ValueError(f"Unexpected response format: {data}")
                
                return data["embedding"]
            except httpx.HTTPError as e:
                raise Exception(f"Failed to get embedding from Ollama: {str(e)}")
    
    async def generate(self, prompt: str, stream: bool = False) -> str:
        """
        Generate text response using Llama 3.1
        
        Args:
            prompt: Input prompt for the LLM
            stream: Whether to stream the response (not implemented yet)
            
        Returns:
            Generated text response
            
        Raises:
            httpx.HTTPError: If API call fails
        """
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.llm_model,
            "prompt": prompt,
            "stream": stream
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                if "response" not in data:
                    raise ValueError(f"Unexpected response format: {data}")
                
                return data["response"]
            except httpx.HTTPError as e:
                raise Exception(f"Failed to generate text from Ollama: {str(e)}")
    
    async def check_health(self) -> bool:
        """Check if Ollama service is available"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except:
            return False


# Global instance
ollama_client = OllamaClient()

