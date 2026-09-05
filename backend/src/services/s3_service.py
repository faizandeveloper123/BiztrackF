import boto3
import uuid
import os
from pathlib import Path
from typing import Optional
import logging
from botocore.exceptions import ClientError, NoCredentialsError
from botocore.config import Config

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.bucket_name = os.getenv('S3_BUCKET_NAME')
        self.access_key_id = os.getenv('S3_ACCESS_KEY_ID')
        self.secret_access_key = os.getenv('S3_SECRET_ACCESS_KEY')
        self.public_access_key_id = os.getenv('S3_PUBLIC_ACCESS_KEY_ID')
        self.endpoint_url = os.getenv('S3_ENDPOINT_URL')
        self.region = os.getenv('S3_REGION', 'eu-north-1')
        self.s3_client = None
        self.public_url_base = None
        self.enabled = False
        
        if not self.bucket_name:
            logger.warning("S3_BUCKET_NAME not configured. File upload functionality is disabled.")
            return
        
        if not self.access_key_id or not self.secret_access_key:
            logger.warning("S3 credentials not found. File upload functionality is disabled.")
            return
        
        if not self.endpoint_url:
            logger.warning("S3_ENDPOINT_URL not configured. File upload functionality is disabled.")
            return
        
        if not self.public_access_key_id:
            logger.warning("S3_PUBLIC_ACCESS_KEY_ID not configured. File upload functionality is disabled.")
            return
        
        try:
            client_config = Config(s3={'addressing_style': 'path'})
            boto3_config = {
                'aws_access_key_id': self.access_key_id,
                'aws_secret_access_key': self.secret_access_key,
                'endpoint_url': self.endpoint_url,
                'region_name': self.region,
            }
            
            self.public_url_base = f"{self.endpoint_url}/{self.public_access_key_id}:{self.bucket_name}"
            self.s3_client = boto3.client('s3', config=client_config, **boto3_config)
            self.enabled = True
            logger.info(f"Contabo S3 service initialized - Endpoint: {self.endpoint_url}, Bucket: {self.bucket_name}")
            logger.info(f"API Access Key: {self.access_key_id[:8]}...")
            logger.info(f"Public URL Access Key: {self.public_access_key_id[:8]}...")
            logger.info(f"Public URL base format: {self.public_url_base}")
        except NoCredentialsError:
            logger.warning("S3 credentials not found. File upload functionality is disabled.")
        except Exception as e:
            logger.warning(f"Failed to initialize S3 client: {str(e)}. File upload functionality is disabled.")
    
    def _check_enabled(self):
        if not self.enabled:
            raise ValueError("S3 storage is not configured. Please set S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_ACCESS_KEY_ID, and S3_ENDPOINT_URL environment variables.")
    
    def extract_s3_key_from_url(self, url: str) -> Optional[str]:
        """Extract S3 key from Contabo URL format"""
        if not url:
            return None
        
        try:
            if 'contabostorage.com' not in url:
                logger.warning(f"URL does not appear to be a Contabo URL: {url}")
                return None
            
            url_without_params = url.split('?')[0]
            
            folder_patterns = ['/logos/', '/avatars/', '/documents/', '/employees/', '/reports/']
            for pattern in folder_patterns:
                if pattern in url_without_params:
                    parts = url_without_params.split(pattern)
                    if len(parts) > 1:
                        s3_key = pattern.strip('/') + '/' + parts[1]
                        logger.info(f"Extracted S3 key: {s3_key} from URL: {url}")
                        return s3_key
            
            if self.bucket_name:
                bucket_pattern = f'/{self.bucket_name}/'
                if bucket_pattern in url_without_params:
                    parts = url_without_params.split(bucket_pattern)
                    if len(parts) > 1:
                        s3_key = parts[1]
                        logger.info(f"Extracted S3 key: {s3_key} from URL: {url}")
                        return s3_key
                
                access_key_bucket_pattern = f':{self.bucket_name}/'
                if access_key_bucket_pattern in url_without_params:
                    parts = url_without_params.split(access_key_bucket_pattern)
                    if len(parts) > 1:
                        s3_key = parts[1]
                        logger.info(f"Extracted S3 key: {s3_key} from URL: {url}")
                        return s3_key
            
            logger.warning(f"Could not extract S3 key from URL: {url}")
            return None
        except Exception as e:
            logger.error(f"Error extracting S3 key from URL {url}: {str(e)}")
            return None

    def upload_logo(self, file_content: bytes, tenant_id: str, original_filename: str) -> dict:
        """Upload logo to S3 and return file info"""
        self._check_enabled()
        try:
            # Generate unique filename
            file_extension = Path(original_filename).suffix.lower() if original_filename else ".png"
            unique_filename = f"logo_{uuid.uuid4().hex}{file_extension}"
            
            # S3 key (path in bucket)
            s3_key = f"logos/{tenant_id}/{unique_filename}"
            
            put_params = {
                'Bucket': self.bucket_name,
                'Key': s3_key,
                'Body': file_content,
                'ContentType': self._get_content_type(file_extension),
            }
            
            logger.info(f"[UPLOAD LOGO] Starting upload - S3 Key: {s3_key}, Tenant ID: {tenant_id}, Original filename: {original_filename}")
            logger.info(f"[UPLOAD LOGO] Upload params - Bucket: {self.bucket_name}, ContentType: {put_params['ContentType']}")
            
            self.s3_client.put_object(**put_params)
            
            public_url = f"{self.public_url_base}/{s3_key}"
            
            logger.info(f"[UPLOAD LOGO] Upload successful - S3 Key: {s3_key}")
            logger.info(f"[UPLOAD LOGO] Generated public URL: {public_url}")
            logger.info(f"[UPLOAD LOGO] URL format breakdown - Endpoint: {self.endpoint_url}, PublicAccessKey:Bucket: {self.public_access_key_id}:{self.bucket_name}, S3 Key: {s3_key}")
            logger.info(f"[UPLOAD LOGO] API Access Key (for operations): {self.access_key_id[:8]}..., Public Access Key (for URLs): {self.public_access_key_id[:8]}...")
            
            try:
                actual_url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': s3_key},
                    ExpiresIn=3600
                )
                logger.info(f"[UPLOAD LOGO] Contabo presigned URL (for comparison): {actual_url}")
            except Exception as e:
                logger.warning(f"[UPLOAD LOGO] Could not generate presigned URL for comparison: {str(e)}")
            
            return {
                "success": True,
                "file_url": public_url,
                "filename": unique_filename,
                "s3_key": s3_key,
                "original_filename": original_filename
            }
            
        except ClientError as e:
            logger.error(f"S3 error uploading logo: {str(e)}")
            raise Exception(f"Failed to upload logo: {str(e)}")
        except Exception as e:
            logger.error(f"Error uploading logo: {str(e)}")
            raise Exception(f"Failed to upload logo: {str(e)}")

    def delete_logo(self, s3_key: str) -> bool:
        """Delete logo from S3"""
        if not self.enabled:
            logger.warning("S3 storage not enabled, skipping logo deletion")
            return False
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f"Logo deleted successfully: {s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"S3 error deleting logo: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error deleting logo: {str(e)}")
            return False

    def get_logo_url(self, s3_key: str) -> str:
        """Get public URL for a logo"""
        if not self.enabled:
            return ""
        return f"{self.public_url_base}/{s3_key}"
    
    def get_signed_url(self, s3_key: str, expiration: int = 3600) -> str:
        """Generate a signed URL for private access (valid for specified seconds)"""
        if not self.enabled:
            return ""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            logger.error(f"Error generating signed URL: {str(e)}")
            return f"{self.public_url_base}/{s3_key}"

    def list_tenant_logos(self, tenant_id: str) -> list:
        """List all logos for a tenant"""
        if not self.enabled:
            return []
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"logos/{tenant_id}/"
            )
            
            logos = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    logos.append({
                        "s3_key": obj['Key'],
                        "filename": obj['Key'].split('/')[-1],
                        "size": obj['Size'],
                        "last_modified": obj['LastModified'],
                        "url": self.get_logo_url(obj['Key'])
                    })
            
            return logos
            
        except ClientError as e:
            logger.error(f"S3 error listing logos: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Error listing logos: {str(e)}")
            return []

    def upload_file(self, file_content: bytes, tenant_id: str, folder: str, original_filename: str) -> dict:
        """Upload any file to S3 and return file info"""
        self._check_enabled()
        try:
            file_extension = Path(original_filename).suffix.lower() if original_filename else ""
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            
            s3_key = f"{folder}/{tenant_id}/{unique_filename}"
            
            content_type = self._get_content_type_for_all_files(file_extension)
            
            put_params = {
                'Bucket': self.bucket_name,
                'Key': s3_key,
                'Body': file_content,
                'ContentType': content_type,
            }
            
            logger.info(f"[UPLOAD FILE] Starting upload - S3 Key: {s3_key}, Tenant ID: {tenant_id}, Folder: {folder}, Original filename: {original_filename}")
            logger.info(f"[UPLOAD FILE] Upload params - Bucket: {self.bucket_name}, ContentType: {content_type}")
            
            self.s3_client.put_object(**put_params)
            
            public_url = f"{self.public_url_base}/{s3_key}"
            
            logger.info(f"[UPLOAD FILE] Upload successful - S3 Key: {s3_key}")
            logger.info(f"[UPLOAD FILE] Generated public URL: {public_url}")
            logger.info(f"[UPLOAD FILE] URL format breakdown - Endpoint: {self.endpoint_url}, PublicAccessKey:Bucket: {self.public_access_key_id}:{self.bucket_name}, S3 Key: {s3_key}")
            logger.info(f"[UPLOAD FILE] API Access Key (for operations): {self.access_key_id[:8]}..., Public Access Key (for URLs): {self.public_access_key_id[:8]}...")
            
            try:
                actual_url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': s3_key},
                    ExpiresIn=3600
                )
                logger.info(f"[UPLOAD FILE] Contabo presigned URL (for comparison): {actual_url}")
            except Exception as e:
                logger.warning(f"[UPLOAD FILE] Could not generate presigned URL for comparison: {str(e)}")
            
            return {
                "success": True,
                "file_url": public_url,
                "filename": unique_filename,
                "s3_key": s3_key,
                "original_filename": original_filename,
                "content_type": content_type
            }
            
        except ClientError as e:
            logger.error(f"S3 error uploading file: {str(e)}")
            raise Exception(f"Failed to upload file: {str(e)}")
        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            raise Exception(f"Failed to upload file: {str(e)}")
    
    def delete_file(self, s3_key: str) -> bool:
        """Delete any file from S3"""
        if not self.enabled:
            logger.warning("S3 storage not enabled, skipping file deletion")
            return False
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            logger.info(f"File deleted successfully: {s3_key}")
            return True
            
        except ClientError as e:
            logger.error(f"S3 error deleting file: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return False
    
    def _get_content_type(self, file_extension: str) -> str:
        """Get content type based on file extension"""
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        return content_types.get(file_extension.lower(), 'application/octet-stream')
    
    def _get_content_type_for_all_files(self, file_extension: str) -> str:
        """Get content type for all file types"""
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
        }
        return content_types.get(file_extension.lower(), 'application/octet-stream')

    def test_connection(self) -> bool:
        """Test S3 connection"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info("S3 connection test successful")
            return True
        except ClientError as e:
            logger.error(f"S3 connection test failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"S3 connection test failed: {str(e)}")
            return False
    
    def verify_file_access(self, s3_key: str) -> bool:
        """Verify if a file is publicly accessible"""
        if not self.enabled:
            return False
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            logger.error(f"File access verification failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error verifying file access: {str(e)}")
            return False

# Create singleton instance
s3_service = S3Service()
