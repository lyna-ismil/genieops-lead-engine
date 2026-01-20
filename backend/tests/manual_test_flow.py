import httpx
import json
import asyncio

# Configuration
API_URL = "http://127.0.0.1:8000"

async def test_project_crud():
    print("\n--- Testing Project CRUD ---")
    async with httpx.AsyncClient(base_url=API_URL, timeout=30.0) as client:
        # 1. Create Project
        payload = {
            "name": "Test Integration Project",
            "icp": {
                "role": "Marketing Manager",
                "industry": "SaaS",
                "painPoints": ["Low conversion", "High churn"],
                "goals": ["Increase leads"]
            }
        }
        print(f"Creating project with payload: {payload}")
        try:
            response = await client.post("/api/projects", json=payload)
            response.raise_for_status()
            project = response.json()  # Adjust if wrapped in {data: ...}
            if 'data' in project: project = project['data']
            print(f"Project Created: ID={project.get('id')}, Name={project.get('name')}")
            
            project_id = project['id']
            
            # 2. Get Project
            print(f"Fetching project {project_id}...")
            get_res = await client.get(f"/api/projects/{project_id}")
            get_res.raise_for_status()
            fetched = get_res.json()
            if 'data' in fetched: fetched = fetched['data']
            
            # Verify nested ICP
            icp = fetched.get('icp')
            print(f"Fetched ICP: {icp}")
            assert icp['role'] == "Marketing Manager"
            assert "Low conversion" in icp.get('painPoints', []) or "Low conversion" in icp.get('pain_points', [])
            print("OK Project CRUD Verified")
            return project_id
        except Exception as e:
            print(f"FAIL Project CRUD Failed: {e}")
            if 'response' in locals(): print(response.text)
            return None

async def test_llm_endpoints(project_id):
    if not project_id:
        print("Skipping LLM tests due to missing project_id")
        return

    print("\n--- Testing LLM Endpoints ---")
    async with httpx.AsyncClient(base_url=API_URL, timeout=60.0) as client:
        # 1. Ideate
        print("Testing /api/llm/ideate...")
        ideate_payload = {
            "icp": {
                "role": "Marketing Manager",
                "industry": "SaaS",
                "painPoints": ["Low conversion"],
                "goals": ["Increase leads"]
            }
        }
        # Wait, the endpoint usage in frontend is: 
        # POST /api/llm/ideate with body { role, industry, ... } directly?
        # Let's check `backend/app/api/routes/llm.py` logic briefly in thought or assume standard.
        # Actually, let's try standard ICP shape.
        
        try:
            # Note: The backend likely uses snake_case or camelCase depending on configuration.
            # Frontend sends camelCase. Backend Pydantic usually accepts it if configured or aliases.
            res = await client.post("/api/llm/ideate", json=ideate_payload)
            res.raise_for_status()
            ideas = res.json()
            
            # Handle potential { success: true, data: [...] } wrapper
            if isinstance(ideas, dict) and 'data' in ideas: ideas = ideas['data']
            
            print(f"Generated {len(ideas)} ideas.")
            if len(ideas) > 0:
                print(f"Sample Idea: {ideas[0].get('title')}")
                selected_idea = ideas[0]
            else:
                print("FAIL No ideas generated")
                return

            print("OK Ideation Verified")

            # 2. Landing Page
            print("Testing /api/llm/landing-page...")
            # Endpoint `generate_landing_page` usually takes { idea: ..., icp: ... }
            lp_payload = {
                "idea": selected_idea,
                "icp": ideate_payload
            }
            
            res_lp = await client.post("/api/llm/landing-page", json=lp_payload)
            res_lp.raise_for_status()
            lp_data = res_lp.json()
            if isinstance(lp_data, dict) and 'data' in lp_data: lp_data = lp_data['data']

            print("Landing Page Generated:")
            print(f"Headline: {lp_data.get('headline')}")
            assert 'html_content' in lp_data or 'htmlContent' in lp_data
            print("OK Landing Page Verified")

        except Exception as e:
            print(f"FAIL LLM Tests Failed: {e}")
            if 'res' in locals(): print(f"Ideate Resp: {res.text}")
            if 'res_lp' in locals(): print(f"LP Resp: {res_lp.text}")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    pid = loop.run_until_complete(test_project_crud())
    loop.run_until_complete(test_llm_endpoints(pid))
    loop.close()
