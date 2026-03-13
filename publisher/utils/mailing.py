# publisher/utils/mailing.py
# Uses Mailchimp Transactional API (formerly Mandrill)
# Docs: https://mailchimp.com/developer/transactional/api/messages/send-new-message/

import os
import mailchimp_transactional as MailchimpTransactional
from mailchimp_transactional.api_client import ApiClientError


def send_mail(mail_content: str, mail_subject: str, mail_recipients: list[str]):
    api_key = os.environ.get("MAILCHIMP_API_KEY")
    if not api_key:
        raise EnvironmentError("MAILCHIMP_API_KEY is not set")

    client = MailchimpTransactional.Client(api_key)

    message = {
        "from_email": "innovacion@chequeado.com",
        "from_name":  "Botletín Oficial",
        "subject":    mail_subject,
        "html":       mail_content,
        "to": [
            {"email": recipient, "type": "to"}
            for recipient in mail_recipients
            if recipient  # skip empty strings
        ],
    }

    try:
        response = client.messages.send({"message": message})
        for result in response:
            print(f"  {result['email']} → {result['status']} (id: {result.get('_id', '—')})")
    except ApiClientError as e:
        print(f"Mailchimp error: {e.text}")
        raise