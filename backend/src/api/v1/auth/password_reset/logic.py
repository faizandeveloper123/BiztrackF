import secrets
from datetime import timedelta, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .....config.database import get_user_by_email
from .....models.platform import PasswordResetToken, User as UserModel
from .....core.auth import get_password_hash
from .schemas import PasswordResetRequest, PasswordResetConfirm, PasswordResetResponse


async def request_password_reset(request: PasswordResetRequest, db: Session):
    user = get_user_by_email(request.email, db)

    if not user:
        return PasswordResetResponse(
            message="If an account with that email exists, we've sent a password reset link.",
            success=True,
            token=None
        )

    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    reset_token_record = PasswordResetToken(
        token=reset_token,
        user_id=user.id,
        expires_at=expires_at,
        is_used=False
    )
    db.add(reset_token_record)
    db.commit()

    try:
        send_password_reset_email(user.email, reset_token)
    except Exception as e:
        print(f"Failed to send email: {e}")

    return PasswordResetResponse(
        message="If an account with that email exists, we've sent a password reset link.",
        success=True,
        token=reset_token
    )


async def confirm_password_reset(request: PasswordResetConfirm, db: Session):
    reset_token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == request.token,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not reset_token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    user = db.query(UserModel).filter(UserModel.id == reset_token_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.hashedPassword = get_password_hash(request.new_password)

    reset_token_record.is_used = True

    db.commit()

    return PasswordResetResponse(
        message="Password has been reset successfully. You can now log in with your new password.",
        success=True
    )


def send_password_reset_email(email: str, token: str):
    reset_link = f"https://biztrack.uk/reset-password/confirm?token={token}"

    print(f"\n{'='*60}")
    print(f"PASSWORD RESET EMAIL")
    print(f"{'='*60}")
    print(f"To: {email}")
    print(f"Subject: Reset Your Password")
    print(f"{'='*60}")
    print(f"Click the link below to reset your password:")
    print(f"{reset_link}")
    print(f"{'='*60}")
    print(f"This link will expire in 1 hour.")
    print(f"{'='*60}\n")
