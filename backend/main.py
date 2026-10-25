import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import bcrypt
from pydantic import BaseModel, EmailStr

from backend import models
from backend.database import engine, get_db

# Create database tables automatically on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="VayuGyan Production API", version="1.0")

# --- CORS MIDDLEWARE BLOCK ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all frontend origins during development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (POST, GET, etc.)
    allow_headers=["*"],  # Allows all headers
)
# -----------------------------

# Temporary in-memory store for OTPs during development: { email: otp_code }
otp_store = {}

# Pydantic Schemas for Request Validation
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class ContactFormRequest(BaseModel):
    full_name: str
    email: EmailStr
    inquiry_type: str
    message: str

# Helper functions for direct bcrypt hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# Function to send real emails via SMTP (Port 587 with STARTTLS)
def send_otp_email(to_email: str, otp_code: str):
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD", "").replace(" ", "")

    if not sender_email or not sender_password:
        print(f"\n[WARNING] SMTP credentials not found in .env! Fallback OTP for {to_email}: {otp_code}\n")
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = "VayuGyan Password Reset OTP"
    message["From"] = sender_email
    message["To"] = to_email

    html = f"""
    <html>
      <body style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
        <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0F172A; margin-bottom: 10px;">Password Reset Request</h2>
          <p style="color: #64748b; font-size: 14px;">You requested a password reset for your VayuGyan account. Use the 6-digit OTP code below to proceed:</p>
          <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0F172A; border-radius: 8px; margin: 20px 0;">
            {otp_code}
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This code will expire shortly. If you didn't request this, please ignore this email.</p>
        </div>
      </body>
    </html>
    """

    message.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, message.as_string())
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail=f"Email dispatch error: {str(e)}")

# Helper function to dispatch contact form submissions to VayuGyan admin email
def send_contact_notification(name: str, sender_email: str, inquiry_type: str, message_body: str):
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    admin_receiver = os.getenv("SENDER_EMAIL", "Vayugyan00@gmail.com")
    sender_password = os.getenv("SENDER_PASSWORD", "").replace(" ", "")

    if not admin_receiver or not sender_password:
        print(f"\n[CONTACT FORM SUBMISSION] From: {name} ({sender_email})\nType: {inquiry_type}\nMessage: {message_body}\n")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"New Contact Message: {inquiry_type} - {name}"
    msg["From"] = admin_receiver
    msg["To"] = admin_receiver
    msg["Reply-To"] = sender_email

    html_content = f"""
    <html>
      <body style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
        <div style="max-width: 520px; margin: auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0F172A; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">New Website Contact Inquiry</h2>
          <p style="margin: 8px 0; font-size: 14px; color: #334155;"><strong>From:</strong> {name} ({sender_email})</p>
          <p style="margin: 8px 0; font-size: 14px; color: #334155;"><strong>Inquiry Category:</strong> {inquiry_type}</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-top: 16px; font-size: 14px; color: #0F172A; line-height: 1.6; white-space: pre-wrap;">
{message_body}
          </div>
        </div>
      </body>
    </html>
    """
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(admin_receiver, sender_password)
            server.sendmail(admin_receiver, admin_receiver, msg.as_string())
    except Exception as e:
        print(f"Failed to dispatch contact notification email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email notification: {str(e)}")

# 1. Register Endpoint
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    hashed_pwd = hash_password(user.password)

    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_pwd
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Account created successfully", "email": new_user.email}

# 2. Login Endpoint
@app.post("/api/auth/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if not db_user or not verify_password(user.password, str(db_user.hashed_password)):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "message": "Login successful",
        "user": {
            "name": db_user.full_name,
            "email": db_user.email
        }
    }

# 3. Forgot Password Endpoint (Generates OTP & Emails User)
@app.post("/api/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Email not found in our records.")
    
    otp_code = str(random.randint(100000, 999999))
    otp_store[payload.email] = otp_code
    
    send_otp_email(payload.email, otp_code)
    
    return {"message": "OTP sent successfully to your email address!"}

# 4. Reset Password with OTP Endpoint
@app.post("/api/auth/reset-password-otp")
def reset_password_otp(payload: ResetPasswordOTPRequest, db: Session = Depends(get_db)):
    stored_otp = otp_store.get(payload.email)
    if not stored_otp or stored_otp != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")
    
    db_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    db_user.hashed_password = hash_password(payload.new_password)  # type: ignore
    db.commit()
    
    if payload.email in otp_store:
        del otp_store[payload.email]
    
    return {"message": "Password successfully reset! You can now sign in."}

# 5. Contact Form Submission Endpoint
@app.post("/api/contact")
def handle_contact_form(payload: ContactFormRequest):
    send_contact_notification(payload.full_name, payload.email, payload.inquiry_type, payload.message)
    return {"message": "Thank you! Your message has been received and delivered."}