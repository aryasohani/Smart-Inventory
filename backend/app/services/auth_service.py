from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.exceptions import (
    ConflictException,
    UnauthorizedException,
    BadRequestException,
)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> User:
        result = await self.db.execute(
            select(User).where(User.email == data.email)
        )

        if result.scalar_one_or_none():
            raise ConflictException("Email already registered")

        user = User(
            email=data.email,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
            role=data.role,
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def login(self, data: LoginRequest) -> TokenResponse:
        result = await self.db.execute(
            select(User).where(
                User.email == data.email,
                User.is_active == True
            )
        )

        user = result.scalar_one_or_none()

        if not user or not verify_password(
            data.password,
            user.hashed_password
        ):
            raise UnauthorizedException("Invalid email or password")

        access_token = create_access_token(
            user.id,
            user.role.value
        )

        refresh_token = create_refresh_token(user.id)

        user.refresh_token = refresh_token

        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)

        if not payload or payload.get("type") != "refresh":
            raise BadRequestException("Invalid refresh token")

        user_id = payload.get("sub")

        result = await self.db.execute(
            select(User).where(
                User.id == user_id,
                User.is_active == True
            )
        )

        user = result.scalar_one_or_none()

        if not user or user.refresh_token != refresh_token:
            raise UnauthorizedException(
                "Refresh token revoked or invalid"
            )

        access_token = create_access_token(
            user.id,
            user.role.value
        )

        new_refresh = create_refresh_token(user.id)

        user.refresh_token = new_refresh

        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh,
        )

    async def logout(self, user: User) -> None:
        user.refresh_token = None
        await self.db.commit()