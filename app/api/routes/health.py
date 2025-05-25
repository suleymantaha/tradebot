#!/usr/bin/env python3
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "tradebot-backend"}
