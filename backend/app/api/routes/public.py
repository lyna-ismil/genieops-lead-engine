from datetime import datetime, timedelta
import asyncio
from fastapi import APIRouter, HTTPException, Depends, Request, Form, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse
from sqlmodel import Session, select
import bleach
from bleach.css_sanitizer import CSSSanitizer
from app.core.responses import ok
from app.db.session import get_session, engine
from app.models.db import LandingPage as LandingPageDB, EmailLog as EmailLogDB
from app.models.schemas import LeadCreate
from app.services.leads import create_lead, create_email_log
from app.services.email_service import enqueue_sequence_for_lead, send_email

router = APIRouter()


def send_email_task(log_id: str) -> None:
    try:
        with Session(engine) as task_session:
            log = task_session.get(EmailLogDB, log_id)
            if not log:
                return
            asyncio.run(send_email(task_session, log))
    except Exception:
        return


@router.get("/landing/{slug_or_id}", response_model=None)
def get_landing_page_json(slug_or_id: str, session: Session = Depends(get_session)):
    """API endpoint to get landing page data as JSON (for SPA)"""
    landing = session.get(LandingPageDB, slug_or_id)
    if not landing:
        landing = session.exec(select(LandingPageDB).where(LandingPageDB.slug == slug_or_id)).first()
    if not landing:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return ok(landing)


@router.get("/lp/{slug}", response_class=HTMLResponse)
def get_landing_page_html(slug: str, session: Session = Depends(get_session)):
    """Public endpoint to serve server-rendered HTML"""
    landing = session.exec(select(LandingPageDB).where(LandingPageDB.slug == slug)).first()
    if not landing:
        # Fallback to check ID
        landing = session.get(LandingPageDB, slug)
        
    if not landing:
        return HTMLResponse(content="<h1>404 - Page Not Found</h1>", status_code=404)
        
    # Inject simple script for form handling if not present
    html_content = landing.html_content
    css_sanitizer = CSSSanitizer(
        allowed_css_properties=[
            "color",
            "background",
            "background-color",
            "font",
            "font-size",
            "font-weight",
            "font-family",
            "text-align",
            "text-decoration",
            "margin",
            "margin-top",
            "margin-right",
            "margin-bottom",
            "margin-left",
            "padding",
            "padding-top",
            "padding-right",
            "padding-bottom",
            "padding-left",
            "border",
            "border-radius",
            "display",
            "width",
            "height",
            "max-width",
            "min-width",
            "max-height",
            "min-height",
        ]
    )
    allowed_tags = [
        "html",
        "head",
        "body",
        "title",
        "meta",
        "link",
        "style",
        "div",
        "span",
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "a",
        "img",
        "ul",
        "ol",
        "li",
        "br",
        "hr",
        "strong",
        "em",
        "b",
        "i",
        "section",
        "header",
        "footer",
        "main",
        "form",
        "input",
        "button",
        "label",
        "textarea",
        "select",
        "option",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
    ]
    allowed_attrs = {
        "*": ["class", "style", "id"],
        "a": ["href", "title", "target", "rel"],
        "img": ["src", "alt", "title"],
        "input": ["type", "name", "value", "placeholder", "required"],
        "button": ["type"],
        "form": ["action", "method"],
        "textarea": ["name", "placeholder", "required", "rows", "cols"],
        "select": ["name"],
        "option": ["value"],
        "meta": ["charset", "name", "content"],
        "link": ["rel", "href"],
    }
    html_content = bleach.clean(
        html_content,
        tags=allowed_tags,
        attributes=allowed_attrs,
        protocols=["http", "https", "mailto"],
        css_sanitizer=css_sanitizer,
        strip=True,
    )

    # Inject brand logo/name for live display (from campaign product_context)
    try:
        from app.models.db import LeadMagnet as LeadMagnetDB, Campaign as CampaignDB

        lead_magnet = session.get(LeadMagnetDB, landing.lead_magnet_id) if landing.lead_magnet_id else None
        campaign = session.get(CampaignDB, lead_magnet.campaign_id) if lead_magnet else None
        product_context = campaign.product_context or {} if campaign else {}
        logo_url = product_context.get("logo_url") or product_context.get("logoUrl")
        company_name = product_context.get("company_name") or product_context.get("companyName")

        if logo_url:
            name_html = f"<span style=\"font-family:Inter,system-ui,sans-serif;font-weight:600;color:#111827;\">{company_name}</span>" if company_name else ""
            logo_html = (
                "<div id=\"brand-nav\" style=\"display:flex;align-items:center;gap:12px;"
                "padding:16px 24px;border-bottom:1px solid #e5e7eb;background:#ffffff;"
                "position:sticky;top:0;z-index:10;\">"
                f"<img src=\"{logo_url}\" alt=\"{company_name or 'Logo'}\" style=\"height:32px;width:auto;\"/>"
                f"{name_html}"
                "</div>"
            )

            lower = html_content.lower()
            body_idx = lower.find("<body")
            if body_idx != -1:
                close_idx = html_content.find(">", body_idx)
                if close_idx != -1:
                    html_content = html_content[: close_idx + 1] + logo_html + html_content[close_idx + 1 :]
                else:
                    html_content = logo_html + html_content
            else:
                html_content = logo_html + html_content
    except Exception:
        pass
    if "</body>" in html_content and "<script>" not in html_content:
        script = f"""
        <script>
          document.addEventListener('DOMContentLoaded', function() {{
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {{
              form.addEventListener('submit', async (e) => {{
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                // Add honeypot if missing from DOM
                data._honeypot = ""; 
                
                try {{
                  const res = await fetch(f'/public/lp/{slug}/submit', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify(data)
                  }});
                  const result = await res.json();
                  if (result.success) {{
                    if (result.redirect_url) {{
                        window.location.href = result.redirect_url;
                    }} else {{
                        alert('Thanks! We will be in touch.');
                        form.reset();
                    }}
                  }} else {{
                    alert('Something went wrong.');
                  }}
                }} catch (err) {{
                  console.error(err);
                  alert('Error submitting form');
                }}
              }});
            }});
          }});
        </script>
        """
        html_content = html_content.replace("</body>", f"{script}</body>")

    return HTMLResponse(content=html_content)


@router.post("/lp/{slug}/submit", response_model=None)
async def submit_lead_form(
    slug: str, 
    request: Request,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """
    Handle lead form submission from the public landing page.
    Expects JSON body.
    """
    try:
        body = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Honeypot check
    if body.get("_honeypot"):
        # Silently fail (pretend success) to fool bots
        return ok({"message": "Received"})
    
    # 1. Resolve Landing Page
    landing = session.exec(select(LandingPageDB).where(LandingPageDB.slug == slug)).first()
    if not landing:
         landing = session.get(LandingPageDB, slug)
    
    if not landing:
        raise HTTPException(status_code=404, detail="Landing page not found")

    # 2. Extract standard fields
    email = body.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    name = body.get("name") or body.get("full_name")
    company = body.get("company") or body.get("company_name")

    # 3. Create Lead
    # We map the dynamic form fields to the LeadCreate schema where possible
    lead_data = LeadCreate(
        landing_page_id=landing.id,
        lead_magnet_id=landing.lead_magnet_id,
        email=email,
        name=name,
        company=company
    )
    
    lead = create_lead(session, lead_data)
    
    # 4. Log Email Intent (Welcome)
    create_email_log(session, lead.id, "Welcome", "Thanks for downloading.")

    # 5. Enqueue nurture sequence and send immediate email if scheduled now
    logs = enqueue_sequence_for_lead(session, lead)
    now = datetime.utcnow()
    immediate = None
    for log in logs:
        if log.scheduled_at and log.scheduled_at <= now + timedelta(minutes=1):
            if not immediate or log.scheduled_at < immediate.scheduled_at:
                immediate = log
    if immediate:
        background_tasks.add_task(send_email_task, immediate.id)
    
    return ok({"lead_id": lead.id, "message": "Success", "success": True, "redirect_url": f"/landing/{slug}/thank-you"})


@router.get("/lp/{slug}/thank-you", response_class=HTMLResponse)
def get_thank_you_page(slug: str, session: Session = Depends(get_session)):
    """
    Serve the Thank You page with the Upgrade Offer.
    """
    landing = session.exec(select(LandingPageDB).where(LandingPageDB.slug == slug)).first()
    if not landing:
        landing = session.get(LandingPageDB, slug)
    
    if not landing:
        return HTMLResponse(content="<h1>404 - Page Not Found</h1>", status_code=404)

    # Get the Upgrade Offer from the Campaign
    # LandingPage -> LeadMagnet -> Campaign
    from app.models.db import LeadMagnet, Campaign
    
    # We need to manually join or fetch related objects since SQLModel relationships might not be async-loaded automatically in this simple query context if not configured
    # But let's try direct fetching for safety
    lead_magnet = session.get(LeadMagnet, landing.lead_magnet_id)
    if not lead_magnet:
        return HTMLResponse(content="<h1>Error: Lead Magnet not found</h1>", status_code=500)
        
    campaign = session.get(Campaign, lead_magnet.campaign_id)
    if not campaign:
        return HTMLResponse(content="<h1>Error: Campaign not found</h1>", status_code=500)
        
    upgrade = campaign.upgrade_offer or {}
    
    # Simple HTML Template for Thank You Page
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You | {landing.headline}</title>
         <script src="https://cdn.tailwindcss.com"></script>
         <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
         <style>
            body {{ font-family: 'Inter', sans-serif; }}
         </style>
    </head>
    <body class="bg-gray-50 min-h-screen flex flex-col">
        
        <main class="flex-grow flex items-center justify-center p-4">
            <div class="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                
                <!-- Success Header -->
                <div class="bg-green-50 p-8 text-center border-b border-green-100">
                    <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">Success! check your inbox.</h1>
                    <p class="text-green-800">Your {lead_magnet.type.replace('_', ' ')} is on its way to your email.</p>
                </div>

                <!-- Upgrade Offer Section -->
                <div class="p-8 md:p-12">
    """
    
    if upgrade:
        html += f"""
                    <div class="text-center mb-8">
                        <span class="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold tracking-wide uppercase mb-4">
                            Limited Time Offer
                        </span>
                        <h2 class="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4">
                            {upgrade.get('core_offer', 'Wait! Before you go...')}
                        </h2>
                        <div class="flex items-end justify-center gap-3 mb-4">
                            <span class="text-sm text-gray-400 line-through">{upgrade.get('value_anchor', '')}</span>
                            <span class="text-3xl font-extrabold text-gray-900">{upgrade.get('price', '')}</span>
                        </div>
                        <p class="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                            Here is a special offer tailored to your next step.
                        </p>
                    </div>
                    
                    <div class="max-w-2xl mx-auto mb-8">
                        <div class="bg-white border border-purple-100 rounded-xl p-4 mb-4">
                            <div class="flex items-center gap-2 font-semibold text-purple-700 mb-2">
                                <span>🛡️</span>
                                <span>Guarantee</span>
                            </div>
                            <p class="text-gray-700">{upgrade.get('guarantee', '100% satisfaction guaranteed.')}</p>
                        </div>

                        <div class="bg-purple-50 border border-purple-100 rounded-xl p-4">
                            <div class="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">Bonuses Included</div>
                            <ul class="space-y-2 text-sm text-gray-700">
                                {''.join([f"<li class='flex items-start gap-2'><span class='text-purple-500 mt-0.5'>✔</span><span>{b}</span></li>" for b in (upgrade.get('bonuses') or [])])}
                            </ul>
                        </div>
                    </div>

                    <div class="text-center">
                        <a href="#" class="inline-block bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold py-4 px-12 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                            Claim Offer &rarr;
                        </a>
                        <p class="mt-4 text-sm text-gray-400">No thanks, I'll stick to the free guide.</p>
                    </div>
        """
    else:
        html += """
                    <div class="text-center">
                        <p class="text-gray-600">You can close this page now.</p>
                    </div>
        """

    html += """
                </div>
            </div>
        </main>
        
        <footer class="bg-gray-900 text-white py-6 text-center text-sm text-gray-500">
            &copy; 2024 All rights reserved.
        </footer>

    </body>
    </html>
    """
    
    return HTMLResponse(content=html)


@router.get("/landing/{slug}/thank-you", response_model=None)
def get_thank_you_data(slug: str, session: Session = Depends(get_session)):
    landing = session.exec(select(LandingPageDB).where(LandingPageDB.slug == slug)).first()
    if not landing:
        landing = session.get(LandingPageDB, slug)
    if not landing:
        raise HTTPException(status_code=404, detail="Landing page not found")

    from app.models.db import LeadMagnet, Campaign

    lead_magnet = session.get(LeadMagnet, landing.lead_magnet_id)
    if not lead_magnet:
        raise HTTPException(status_code=500, detail="Lead Magnet not found")

    campaign = session.get(Campaign, lead_magnet.campaign_id)
    if not campaign:
        raise HTTPException(status_code=500, detail="Campaign not found")

    upgrade = campaign.upgrade_offer or {}
    product_context = campaign.product_context or {}
    payload = {
        "headline": upgrade.get("core_offer")
        or upgrade.get("coreOffer")
        or upgrade.get("positioning")
        or "Wait! Before you go...",
        "copy": upgrade.get("offerCopy")
        or upgrade.get("offer_copy")
        or "Here is a special offer tailored to your next step.",
        "cta": upgrade.get("cta") or "Claim Offer",
        "coreOffer": upgrade.get("core_offer") or upgrade.get("coreOffer"),
        "price": upgrade.get("price"),
        "valueAnchor": upgrade.get("value_anchor") or upgrade.get("valueAnchor"),
        "guarantee": upgrade.get("guarantee"),
        "bonuses": upgrade.get("bonuses", []),
        "companyName": product_context.get("company_name")
        or product_context.get("companyName")
        or "GenieOps",
        "logoUrl": product_context.get("logo_url")
        or product_context.get("logoUrl"),
        "primaryColor": product_context.get("primary_color")
        or product_context.get("primaryColor")
        or "#2563eb",
        "fontStyle": product_context.get("font_style")
        or product_context.get("fontStyle")
        or "sans",
        "backgroundStyle": getattr(landing, "background_style", "plain_white"),
        "theme": getattr(landing, "theme", "light"),
        "designVibe": product_context.get("design_vibe")
        or product_context.get("designVibe"),
    }

    return ok(payload)


@router.post("/landing/{slug_or_id}", response_model=None)
async def submit_lead_api(
    slug_or_id: str, 
    request: Request,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """
    API endpoint for lead submission (matching user requirement).
    """
    try:
        body = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Honeypot check
    if body.get("_honeypot"):
        return ok({"message": "Received"})
    
    # 1. Resolve Landing Page
    landing = session.get(LandingPageDB, slug_or_id)
    if not landing:
         landing = session.exec(select(LandingPageDB).where(LandingPageDB.slug == slug_or_id)).first()
    
    if not landing:
        raise HTTPException(status_code=404, detail="Landing page not found")

    # 2. Extract standard fields
    email = body.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    name = body.get("name") or body.get("full_name")
    company = body.get("company") or body.get("company_name")

    # 3. Create Lead
    lead_data = LeadCreate(
        landing_page_id=landing.id,
        lead_magnet_id=landing.lead_magnet_id,
        email=email,
        name=name,
        company=company
    )
    
    lead = create_lead(session, lead_data)
    
    # 4. Log Email Intent (Welcome)
    create_email_log(session, lead.id, "Welcome", "Thanks for downloading.")

    # 5. Enqueue nurture sequence and send immediate email if scheduled now
    logs = enqueue_sequence_for_lead(session, lead)
    now = datetime.utcnow()
    immediate = None
    for log in logs:
        if log.scheduled_at and log.scheduled_at <= now + timedelta(minutes=1):
            if not immediate or log.scheduled_at < immediate.scheduled_at:
                immediate = log
    if immediate:
        background_tasks.add_task(send_email_task, immediate.id)
    
    return ok({"lead_id": lead.id, "message": "Success"})

