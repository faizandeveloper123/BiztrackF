import os
import json
import uuid
import re
import logging
import base64
from datetime import datetime
from typing import Dict, Any, Optional, List
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/calendar']

GOOGLE_OAUTH_REDIRECT_URI = os.getenv("GOOGLE_OAUTH_REDIRECT_URI") or os.getenv("GOOGLE_REDIRECT_URI")

if not GOOGLE_OAUTH_REDIRECT_URI:
    logger.warning("GOOGLE_OAUTH_REDIRECT_URI environment variable not set. Will use default or client_secrets.json")
else:
    logger.info(f"GOOGLE_OAUTH_REDIRECT_URI loaded from environment: {GOOGLE_OAUTH_REDIRECT_URI}")

EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def is_valid_email(email: str) -> bool:
    return bool(EMAIL_PATTERN.match(email.strip())) if email else False

def filter_valid_emails(participants: List[str]) -> List[str]:
    valid_emails = []
    invalid_emails = []
    
    for participant in participants:
        if isinstance(participant, str):
            participant = participant.strip()
            if is_valid_email(participant):
                valid_emails.append(participant)
            else:
                invalid_emails.append(participant)
    
    if invalid_emails:
        logger.warning(f"Filtered out invalid email addresses: {invalid_emails}")
    
    return valid_emails

class GoogleMeetService:
    def __init__(self, user_email: Optional[str] = None):
        self.credentials = None
        self.service = None
        self.user_email = user_email
        if user_email:
            self._load_credentials()
        else:
            logger.warning("User email is required for OAuth authentication")
    
    def _get_token_path(self) -> str:
        if not self.user_email:
            raise ValueError("User email is required to determine token path")
        tokens_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'tokens')
        os.makedirs(tokens_dir, exist_ok=True)
        safe_email = self.user_email.replace('@', '_at_').replace('.', '_')
        return os.path.join(tokens_dir, f'{safe_email}_token.json')
    
    def _load_credentials(self):
        try:
            client_secrets_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'client_secrets.json')
            if not os.path.exists(client_secrets_path):
                client_secrets_path = 'client_secrets.json'
            
            if not os.path.exists(client_secrets_path):
                logger.warning("OAuth2 client secrets not found")
                self.service = None
                return
            
            token_path = self._get_token_path()
            
            if os.path.exists(token_path):
                try:
                    with open(token_path, 'r') as token_file:
                        token_data = json.load(token_file)
                        self.credentials = Credentials.from_authorized_user_info(token_data, SCOPES)
                    
                    if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                        self.credentials.refresh(Request())
                        with open(token_path, 'w') as token_file:
                            token_file.write(self.credentials.to_json())
                    
                    self.service = build('calendar', 'v3', credentials=self.credentials)
                    return
                except Exception as e:
                    logger.error(f"Failed to load OAuth2 token: {e}")
                    self.service = None
            else:
                self.service = None
                
        except Exception as e:
            logger.error(f"Failed to load OAuth2 credentials: {e}")
            self.service = None
    
    def get_authorization_url(self, redirect_uri: Optional[str] = None) -> str:
        client_secrets_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'client_secrets.json')
        if not os.path.exists(client_secrets_path):
            client_secrets_path = 'client_secrets.json'
        
        if not os.path.exists(client_secrets_path):
            raise FileNotFoundError("client_secrets.json not found. Please set up OAuth2 credentials.")
        
        with open(client_secrets_path, 'r') as f:
            client_config = json.load(f)
        
        if not redirect_uri:
            if GOOGLE_OAUTH_REDIRECT_URI:
                redirect_uri = GOOGLE_OAUTH_REDIRECT_URI
                logger.info(f"Using redirect URI from environment variable: {redirect_uri}")
            elif 'web' in client_config:
                client_info = client_config['web']
                redirect_uris = client_info.get('redirect_uris', [])
                if redirect_uris:
                    redirect_uri = redirect_uris[0]
                    logger.info(f"Using redirect URI from client_secrets.json: {redirect_uri}")
                else:
                    redirect_uri = 'https://www.biztrack.uk/api/events/google/callback'
                    logger.warning(f"No redirect URI found, using default: {redirect_uri}")
            else:
                redirect_uri = 'https://www.biztrack.uk/api/events/google/callback'
                logger.warning(f"Using fallback redirect URI: {redirect_uri}")
        
        logger.info(f"Final redirect URI being used: {redirect_uri}")
        
        flow = Flow.from_client_secrets_file(
            client_secrets_path,
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )
        
        state = None
        if self.user_email:
            state_data = {"email": self.user_email}
            state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()
        
        auth_url, _ = flow.authorization_url(
            prompt='consent',
            access_type='offline',
            state=state
        )
        return auth_url
    
    def authorize(self, authorization_code: str, redirect_uri: Optional[str] = None) -> bool:
        try:
            client_secrets_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'client_secrets.json')
            if not os.path.exists(client_secrets_path):
                client_secrets_path = 'client_secrets.json'
            
            if not os.path.exists(client_secrets_path):
                raise FileNotFoundError("client_secrets.json not found")
            
            with open(client_secrets_path, 'r') as f:
                client_config = json.load(f)
            
            if not redirect_uri:
                if GOOGLE_OAUTH_REDIRECT_URI:
                    redirect_uri = GOOGLE_OAUTH_REDIRECT_URI
                    logger.info(f"Using redirect URI from environment variable: {redirect_uri}")
                elif 'web' in client_config:
                    client_info = client_config['web']
                    redirect_uris = client_info.get('redirect_uris', [])
                    if redirect_uris:
                        redirect_uri = redirect_uris[0]
                        logger.info(f"Using redirect URI from client_secrets.json: {redirect_uri}")
                    else:
                        redirect_uri = 'https://www.biztrack.uk/api/events/google/callback'
                        logger.warning(f"No redirect URI found, using default: {redirect_uri}")
                else:
                    redirect_uri = 'https://www.biztrack.uk/api/events/google/callback'
                    logger.warning(f"Using fallback redirect URI: {redirect_uri}")
            
            flow = Flow.from_client_secrets_file(
                client_secrets_path,
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
            flow.fetch_token(code=authorization_code)
            
            self.credentials = flow.credentials
            if not self.credentials:
                logger.error("Failed to obtain credentials from authorization code")
                return False
            
            token_path = self._get_token_path()
            os.makedirs(os.path.dirname(token_path), exist_ok=True)
            
            with open(token_path, 'w') as token_file:
                token_file.write(self.credentials.to_json())
            
            self.service = build('calendar', 'v3', credentials=self.credentials)
            logger.info(f"Successfully authorized and saved token for {self.user_email}")
            return True
        except Exception as e:
            logger.error(f"Authorization failed: {e}", exc_info=True)
            return False
    
    def is_authorized(self) -> bool:
        if not self.user_email:
            return False
        
        if self.service is not None:
            return True
        
        try:
            token_path = self._get_token_path()
            if not os.path.exists(token_path):
                return False
            
            with open(token_path, 'r') as token_file:
                token_data = json.load(token_file)
                if not token_data or not isinstance(token_data, dict):
                    return False
                
                if 'token' not in token_data and 'access_token' not in token_data:
                    return False
            
            self._load_credentials()
            return self.service is not None
        except Exception as e:
            logger.debug(f"Error checking authorization status: {e}")
            return False
    
    def _get_calendar_id(self) -> str:
        return 'primary'
    
    def create_meeting(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if not self.service:
                return {
                    'success': False,
                    'error': 'Google Calendar not authorized',
                    'event_id': None,
                    'meet_link': None
                }
            
            start_time = event_data.get('startDate')
            end_time = event_data.get('endDate')
            
            if not start_time or not end_time:
                return {
                    'success': False,
                    'error': 'Start date and end date are required',
                    'event_id': None,
                    'meet_link': None
                }
            
            if isinstance(start_time, str):
                start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            if isinstance(end_time, str):
                end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            
            if start_time >= end_time:
                return {
                    'success': False,
                    'error': 'End date must be after start date',
                    'event_id': None,
                    'meet_link': None
                }
            
            time_diff = (end_time - start_time).total_seconds()
            if time_diff < 60:
                return {
                    'success': False,
                    'error': 'Event duration must be at least 1 minute',
                    'event_id': None,
                    'meet_link': None
                }
            
            participants = event_data.get('participants', [])
            valid_emails = filter_valid_emails(participants) if participants else []
            
            event = {
                'summary': event_data.get('title', 'Meeting'),
                'description': event_data.get('description', ''),
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': event_data.get('timezone', 'UTC'),
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': event_data.get('timezone', 'UTC'),
                },
                'conferenceData': {
                    'createRequest': {
                        'requestId': str(uuid.uuid4()),
                        'conferenceSolutionKey': {
                            'type': 'hangoutsMeet'
                        }
                    }
                }
            }
            
            if valid_emails:
                event['attendees'] = [{'email': email} for email in valid_emails]
            
            calendar_id = self._get_calendar_id()
            event = self.service.events().insert(
                calendarId=calendar_id,
                body=event,
                conferenceDataVersion=1
            ).execute()
            
            meet_link = None
            if 'conferenceData' in event and 'entryPoints' in event['conferenceData']:
                for entry in event['conferenceData']['entryPoints']:
                    if entry['entryPointType'] == 'video':
                        meet_link = entry['uri']
                        break
            
            return {
                'success': True,
                'event_id': event['id'],
                'meet_link': meet_link,
                'event': event
            }
            
        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': f"Google Calendar API error: {error}",
                'event_id': None,
                'meet_link': None
            }
        except Exception as e:
            logger.error(f"Error creating meeting: {e}")
            return {
                'success': False,
                'error': str(e),
                'event_id': None,
                'meet_link': None
            }
    
    def update_meeting(self, event_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            if not self.service:
                return {
                    'success': False,
                    'error': 'Google Calendar service not available'
                }
            
            calendar_id = self._get_calendar_id()
            event = self.service.events().get(calendarId=calendar_id, eventId=event_id).execute()
            
            if 'title' in update_data:
                event['summary'] = update_data['title']
            if 'description' in update_data:
                event['description'] = update_data['description']
            if 'startDate' in update_data:
                start_time = update_data['startDate']
                if isinstance(start_time, str):
                    start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                event['start'] = {
                    'dateTime': start_time.isoformat(),
                    'timeZone': update_data.get('timezone', 'UTC'),
                }
            if 'endDate' in update_data:
                end_time = update_data['endDate']
                if isinstance(end_time, str):
                    end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                event['end'] = {
                    'dateTime': end_time.isoformat(),
                    'timeZone': update_data.get('timezone', 'UTC'),
                }
            
            calendar_id = self._get_calendar_id()
            updated_event = self.service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=event
            ).execute()
            
            return {
                'success': True,
                'event': updated_event
            }
            
        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': f"Google Calendar API error: {error}"
            }
        except Exception as e:
            logger.error(f"Error updating meeting: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_meeting(self, event_id: str) -> Dict[str, Any]:
        try:
            if not self.service:
                return {
                    'success': False,
                    'error': 'Google Calendar service not available'
                }
            
            calendar_id = self._get_calendar_id()
            self.service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
            
            return {
                'success': True
            }
            
        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return {
                'success': False,
                'error': f"Google Calendar API error: {error}"
            }
        except Exception as e:
            logger.error(f"Error deleting meeting: {e}")
            return {
                'success': False,
                'error': str(e)
            }
