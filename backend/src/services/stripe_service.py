import os
import stripe
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

if not stripe.api_key:
    logger.warning("STRIPE_SECRET_KEY not found in environment variables")

class StripeService:
    def __init__(self):
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        
    def create_checkout_session(
        self,
        plan_id: str,
        plan_name: str,
        plan_price: float,
        tenant_id: str,
        user_email: str,
        success_url: str,
        cancel_url: str,
        billing_cycle: str = 'monthly'
    ) -> Dict[str, Any]:
        try:
            price_amount = int(plan_price * 100)
            
            interval_map = {
                'monthly': 'month',
                'yearly': 'year'
            }
            interval = interval_map.get(billing_cycle.lower(), 'month')
            
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': plan_name,
                            'description': f'BizTrack {plan_name} Subscription',
                        },
                        'unit_amount': price_amount,
                        'recurring': {
                            'interval': interval,
                        },
                    },
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=user_email,
                metadata={
                    'tenant_id': tenant_id,
                    'plan_id': plan_id,
                },
                subscription_data={
                    'metadata': {
                        'tenant_id': tenant_id,
                        'plan_id': plan_id,
                    }
                }
            )
            
            return {
                'success': True,
                'session_id': session.id,
                'url': session.url
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating checkout session: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Error creating checkout session: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_customer(self, email: str, name: Optional[str] = None, metadata: Optional[Dict] = None) -> Optional[str]:
        try:
            customer_data = {
                'email': email,
            }
            if name:
                customer_data['name'] = name
            if metadata:
                customer_data['metadata'] = metadata
                
            customer = stripe.Customer.create(**customer_data)
            return customer.id
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating customer: {str(e)}")
            return None
    
    def get_subscription(self, subscription_id: str) -> Optional[Dict]:
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                'id': subscription.id,
                'status': subscription.status,
                'customer_id': subscription.customer,
                'current_period_start': datetime.fromtimestamp(subscription.current_period_start),
                'current_period_end': datetime.fromtimestamp(subscription.current_period_end),
                'cancel_at_period_end': subscription.cancel_at_period_end,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error retrieving subscription: {str(e)}")
            return None
    
    def cancel_subscription(self, subscription_id: str, immediately: bool = False) -> bool:
        try:
            if immediately:
                stripe.Subscription.delete(subscription_id)
            else:
                stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            return True
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error cancelling subscription: {str(e)}")
            return False
    
    def update_subscription_price(
        self,
        subscription_id: str,
        new_price: float,
        plan_name: str
    ) -> bool:
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            if not subscription.items.data:
                logger.error(f"No items found in subscription {subscription_id}")
                return False
            
            price_amount = int(new_price * 100)
            
            new_price_obj = stripe.Price.create(
                currency='usd',
                unit_amount=price_amount,
                recurring={'interval': 'month'},
                product_data={'name': plan_name}
            )
            
            stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': subscription.items.data[0].id,
                    'price': new_price_obj.id,
                }],
                proration_behavior='always_invoice'
            )
            
            return True
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error updating subscription price: {str(e)}")
            return False
    
    def verify_webhook(self, payload: bytes, signature: str) -> Optional[Dict]:
        try:
            if not self.webhook_secret:
                logger.error("STRIPE_WEBHOOK_SECRET not configured")
                return None
            
            try:
                event = stripe.Webhook.construct_event(
                    payload, signature, self.webhook_secret
                )
                return event
            except stripe.error.SignatureVerificationError as e:
                logger.error(f"Webhook signature verification failed: {str(e)}")
                logger.error("Make sure you're using the correct webhook secret:")
                logger.error("- For local testing: Use secret from 'stripe listen' command")
                logger.error("- For production: Use secret from Stripe Dashboard webhook settings")
                return None
        except ValueError as e:
            logger.error(f"Invalid payload: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error verifying webhook: {str(e)}")
            return None

stripe_service = StripeService()

