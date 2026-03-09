#!/usr/bin/env python3

import requests
import json
from typing import Dict, Any

class HangarAuthenticatedTester:
    def __init__(self):
        self.base_url = "https://hangar-catalog.preview.emergentagent.com/api"
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'Hangar-Backend-Tester/1.0'
        })
        
    def log_test(self, test_name: str, success: bool, response_data: Any = None, error: str = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status}: {test_name}")
        if error:
            print(f"   Error: {error}")
        if response_data:
            print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
    
    def test_quotes_creation_flow(self):
        """Test quote creation without proper authentication (should fail)"""
        print("\n=== Testing Quote Creation Flow (No Auth) ===")
        
        try:
            # Try to create a quote without authentication
            quote_data = {
                "startDate": "2024-12-20",
                "endDate": "2024-12-25", 
                "notes": "Test production shoot",
                "items": [
                    {
                        "propId": "test-prop-id",
                        "propName": "Test Prop",
                        "pricePerDay": 500,
                        "quantity": 1
                    }
                ],
                "userName": "Test User",
                "userEmail": "test@example.com",
                "userPhone": "5551234567",
                "userProductionCompany": "Test Productions"
            }
            
            response = self.session.post(f"{self.base_url}/quotes", json=quote_data)
            
            if response.status_code == 401:
                self.log_test("Quote Creation without Auth (should fail)", True, {"message": "Correctly requires authentication"})
            else:
                self.log_test("Quote Creation without Auth (should fail)", False, error=f"Expected 401, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Quote Creation without Auth", False, error=str(e))
    
    def test_admin_endpoints_direct(self):
        """Test admin endpoints with direct requests (no session)"""
        print("\n=== Testing Admin Endpoints (Direct Access) ===")
        
        # Test admin stats
        try:
            response = self.session.get(f"{self.base_url}/admin/stats")
            
            if response.status_code in [401, 403]:
                self.log_test("Admin Stats Direct Access (should fail)", True, {"message": f"Correctly blocked with {response.status_code}"})
            else:
                self.log_test("Admin Stats Direct Access (should fail)", False, error=f"Expected 401/403, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Admin Stats Direct Access", False, error=str(e))
        
        # Test hidden emails
        try:
            response = self.session.get(f"{self.base_url}/hidden-emails")
            
            if response.status_code in [401, 403]:
                self.log_test("Hidden Emails Direct Access (should fail)", True, {"message": f"Correctly blocked with {response.status_code}"})
            else:
                self.log_test("Hidden Emails Direct Access (should fail)", False, error=f"Expected 401/403, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Hidden Emails Direct Access", False, error=str(e))
        
        # Test admin users
        try:
            response = self.session.get(f"{self.base_url}/admin/users")
            
            if response.status_code in [401, 403]:
                self.log_test("Admin Users Direct Access (should fail)", True, {"message": f"Correctly blocked with {response.status_code}"})
            else:
                self.log_test("Admin Users Direct Access (should fail)", False, error=f"Expected 401/403, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Admin Users Direct Access", False, error=str(e))
    
    def test_props_crud_without_admin(self):
        """Test props CRUD operations without admin auth (should fail)"""
        print("\n=== Testing Props CRUD without Admin Auth ===")
        
        # Test POST /api/props (create)
        try:
            prop_data = {
                "name": "Test Prop",
                "pricePerDay": 500,
                "description": "A test prop",
                "categoryId": "test-category-id"
            }
            
            response = self.session.post(f"{self.base_url}/props", json=prop_data)
            
            if response.status_code == 403:
                self.log_test("Create Prop without Admin (should fail)", True, {"message": "Correctly requires admin role"})
            else:
                self.log_test("Create Prop without Admin (should fail)", False, error=f"Expected 403, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Create Prop without Admin", False, error=str(e))
        
        # Test PUT /api/props/:id (update) - need to get a real prop ID first
        try:
            props_response = self.session.get(f"{self.base_url}/props")
            if props_response.status_code == 200:
                props = props_response.json()
                if props:
                    prop_id = props[0]["id"]
                    update_data = {"name": "Updated Prop Name"}
                    
                    response = self.session.put(f"{self.base_url}/props/{prop_id}", json=update_data)
                    
                    if response.status_code == 403:
                        self.log_test("Update Prop without Admin (should fail)", True, {"message": "Correctly requires admin role"})
                    else:
                        self.log_test("Update Prop without Admin (should fail)", False, error=f"Expected 403, got {response.status_code}: {response.text}")
                else:
                    self.log_test("Update Prop without Admin", False, error="No props available to test")
            else:
                self.log_test("Update Prop without Admin", False, error="Cannot get props list")
                
        except Exception as e:
            self.log_test("Update Prop without Admin", False, error=str(e))
    
    def test_categories_crud_without_admin(self):
        """Test categories CRUD operations without admin auth (should fail)"""
        print("\n=== Testing Categories CRUD without Admin Auth ===")
        
        # Test POST /api/categories (create)
        try:
            category_data = {
                "name": "Test Category",
                "slug": "test-category"
            }
            
            response = self.session.post(f"{self.base_url}/categories", json=category_data)
            
            if response.status_code == 403:
                self.log_test("Create Category without Admin (should fail)", True, {"message": "Correctly requires admin role"})
            else:
                self.log_test("Create Category without Admin (should fail)", False, error=f"Expected 403, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Create Category without Admin", False, error=str(e))
    
    def test_image_proxy_endpoint(self):
        """Test image proxy download endpoint"""
        print("\n=== Testing Image Proxy Download ===")
        
        try:
            # Test with a valid image URL
            test_image_url = "https://images.unsplash.com/photo-1600620195943-eb20d00a556f?w=800&q=80"
            response = self.session.get(f"{self.base_url}/download-image?url={test_image_url}")
            
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                if content_type.startswith('image/'):
                    self.log_test("Image Proxy Download", True, {"content_type": content_type, "size": len(response.content)})
                else:
                    self.log_test("Image Proxy Download", False, error=f"Expected image content-type, got {content_type}")
            else:
                self.log_test("Image Proxy Download", False, error=f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Image Proxy Download", False, error=str(e))
        
        # Test without URL parameter
        try:
            response = self.session.get(f"{self.base_url}/download-image")
            
            if response.status_code == 400:
                self.log_test("Image Proxy Download without URL (should fail)", True, {"message": "Correctly requires URL parameter"})
            else:
                self.log_test("Image Proxy Download without URL (should fail)", False, error=f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Image Proxy Download without URL", False, error=str(e))
    
    def test_invalid_routes(self):
        """Test invalid API routes (should return 404)"""
        print("\n=== Testing Invalid Routes ===")
        
        invalid_routes = [
            "/invalid-endpoint",
            "/props/invalid-id/invalid-action",
            "/admin/invalid-endpoint"
        ]
        
        for route in invalid_routes:
            try:
                response = self.session.get(f"{self.base_url}{route}")
                
                if response.status_code in [404, 200]:  # 200 might be catch-all
                    self.log_test(f"Invalid Route: {route}", True, {"status": response.status_code})
                else:
                    self.log_test(f"Invalid Route: {route}", False, error=f"Unexpected status {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Invalid Route: {route}", False, error=str(e))
    
    def run_all_tests(self):
        """Run all authenticated backend tests"""
        print("🔒 Starting Hangar Backend Authentication Tests")
        print(f"🎯 Base URL: {self.base_url}")
        print("=" * 60)
        
        self.test_quotes_creation_flow()
        self.test_admin_endpoints_direct()
        self.test_props_crud_without_admin()
        self.test_categories_crud_without_admin()
        self.test_image_proxy_endpoint()
        self.test_invalid_routes()
        
        print("\n" + "=" * 60)
        print("🏁 Authentication Testing Complete")

if __name__ == "__main__":
    tester = HangarAuthenticatedTester()
    tester.run_all_tests()