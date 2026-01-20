from fastapi import APIRouter, HTTPException, Depends, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from sqlmodel import Session, select
from app.core.responses import ok
from app.db.session import get_session
from app.models.db import LandingPage as LandingPageDB
from app.models.schemas import LeadCreate
from app.services.leads import create_lead, create_email_log

router = APIRouter()


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
                  const res = await fetch('/public/lp/{slug}/submit', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify(data)
                  }});
                  const result = await res.json();
                  if (result.success) {{
                    alert('Thanks! We will be in touch.');
                    form.reset();
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
    
    return ok({"lead_id": lead.id, "message": "Success"})


@router.post("/landing/{slug_or_id}", response_model=None)
async def submit_lead_api(
    slug_or_id: str, 
    request: Request,
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
    
    return ok({"lead_id": lead.id, "message": "Success"})

