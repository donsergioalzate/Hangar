#!/usr/bin/env python3

import requests
import json
import time
from typing import Dict, Any

class HangarAPITester:
    def __init__(self):
        self.base_url = "https://hangar-catalog.preview.emergentagent.com/api"
        self.session = requests.Session()
        self.admin_cookies = None
        self.client_cookies = None
        
    def log_test(self, test_name: str, success: bool, response_data: Any = None, error: str = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status}: {test_name}")
        if error:
            print(f"   Error: {error}")
        if response_data:
            print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
    
    def test_1_user_registration(self):
        """Test POST /api/register - High Priority"""
        print("\n=== Testing User Registration API ===")
        
        # Test 1: Valid registration
        try:
            new_user_data = {
                "name": "Juan Pérez",
                "email": "juan.perez@example.com",
                "password": "password123",
                "phone": "5551234567",
                "productionCompany": "Cine Productions"
            }
            
            response = self.session.post(f"{self.base_url}/register", json=new_user_data)
            
            if response.status_code == 201:
                data = response.json()
                self.log_test("Valid User Registration", True, data)
            else:
                self.log_test("Valid User Registration", False, error=f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Valid User Registration", False, error=str(e))
        
        # Test 2: Duplicate email registration
        try:
            duplicate_user = {
                "name": "Another User",
                "email": "juan.perez@example.com",  # Same email
                "password": "password456"
            }
            
            response = self.session.post(f"{self.base_url}/register", json=duplicate_user)
            
            if response.status_code == 409:  # Conflict expected
                self.log_test("Duplicate Email Registration (should fail)", True, {"message": "Correctly rejected duplicate email"})
            else:
                self.log_test("Duplicate Email Registration (should fail)", False, error=f"Expected 409, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Duplicate Email Registration", False, error=str(e))
    
    def test_2_authentication(self):
        """Test NextAuth login functionality"""
        print("\n=== Testing Authentication ===")
        
        # Test admin login via NextAuth credentials
        try:
            admin_login = {
                "email": "admin@hangar.mx",
                "password": "Hangar2024!",
                "csrfToken": ""  # NextAuth handles CSRF
            }
            
            # First get the signin page to get CSRF token
            signin_response = self.session.get(f"{self.base_url}/auth/signin")
            
            # Try login via credentials callback
            auth_response = self.session.post(
                f"{self.base_url}/auth/callback/credentials",
                data=admin_login,
                allow_redirects=False
            )
            
            if auth_response.status_code in [200, 302]:
                self.admin_cookies = self.session.cookies
                self.log_test("Admin Authentication", True, {"status": "Login successful"})
            else:
                self.log_test("Admin Authentication", False, error=f"Status {auth_response.status_code}")
                
        except Exception as e:
            self.log_test("Admin Authentication", False, error=str(e))
        
        # Test client login
        try:
            client_login = {
                "email": "cliente@prueba.mx",
                "password": "Cliente123!",
                "csrfToken": ""
            }
            
            client_response = self.session.post(
                f"{self.base_url}/auth/callback/credentials",
                data=client_login,
                allow_redirects=False
            )
            
            if client_response.status_code in [200, 302]:
                self.log_test("Client Authentication", True, {"status": "Login successful"})
            else:
                self.log_test("Client Authentication", False, error=f"Status {client_response.status_code}")
                
        except Exception as e:
            self.log_test("Client Authentication", False, error=str(e))
    
    def test_3_props_api(self):
        """Test Props CRUD API - High Priority"""
        print("\n=== Testing Props API ===")
        
        # Test 1: GET /api/props (should return 12 props)
        try:
            response = self.session.get(f"{self.base_url}/props")
            
            if response.status_code == 200:
                data = response.json()
                props_count = len(data)
                if props_count == 12:
                    self.log_test("GET All Props (expect 12)", True, {"count": props_count, "first_prop": data[0]["name"] if data else None})
                else:
                    self.log_test("GET All Props (expect 12)", False, error=f"Expected 12 props, got {props_count}")
            else:
                self.log_test("GET All Props", False, error=f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET All Props", False, error=str(e))
        
        # Test 2: GET /api/props with categoryId filter
        try:
            # First get categories to get a valid categoryId
            cats_response = self.session.get(f"{self.base_url}/categories")
            if cats_response.status_code == 200:
                categories = cats_response.json()
                if categories:
                    category_id = categories[0]["id"]
                    response = self.session.get(f"{self.base_url}/props?categoryId={category_id}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        self.log_test("GET Props with categoryId filter", True, {"filtered_count": len(data)})
                    else:
                        self.log_test("GET Props with categoryId filter", False, error=f"Status {response.status_code}")
                else:
                    self.log_test("GET Props with categoryId filter", False, error="No categories found")
            else:
                self.log_test("GET Props with categoryId filter", False, error="Cannot get categories")
                
        except Exception as e:
            self.log_test("GET Props with categoryId filter", False, error=str(e))
        
        # Test 3: GET /api/props/:id
        try:
            # Get first prop ID
            props_response = self.session.get(f"{self.base_url}/props")
            if props_response.status_code == 200:
                props = props_response.json()
                if props:
                    prop_id = props[0]["id"]
                    response = self.session.get(f"{self.base_url}/props/{prop_id}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        self.log_test("GET Single Prop", True, {"prop_name": data.get("name")})
                    else:
                        self.log_test("GET Single Prop", False, error=f"Status {response.status_code}")
                else:
                    self.log_test("GET Single Prop", False, error="No props available")
            else:
                self.log_test("GET Single Prop", False, error="Cannot get props list")
                
        except Exception as e:
            self.log_test("GET Single Prop", False, error=str(e))
    
    def test_4_categories_api(self):
        """Test Categories API - High Priority"""
        print("\n=== Testing Categories API ===")
        
        # Test: GET /api/categories (should return 6 categories)
        try:
            response = self.session.get(f"{self.base_url}/categories")
            
            if response.status_code == 200:
                data = response.json()
                cats_count = len(data)
                if cats_count == 6:
                    category_names = [cat["name"] for cat in data]
                    self.log_test("GET All Categories (expect 6)", True, {"count": cats_count, "categories": category_names})
                else:
                    self.log_test("GET All Categories (expect 6)", False, error=f"Expected 6 categories, got {cats_count}")
            else:
                self.log_test("GET All Categories", False, error=f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("GET All Categories", False, error=str(e))
    
    def test_5_quotes_api_without_auth(self):
        """Test Quotes API without authentication - should return 401"""
        print("\n=== Testing Quotes API (No Auth) ===")
        
        try:
            # Clear any existing cookies
            self.session.cookies.clear()
            
            response = self.session.get(f"{self.base_url}/quotes")
            
            if response.status_code == 401:
                self.log_test("GET Quotes without auth (should be 401)", True, {"message": "Correctly requires authentication"})
            else:
                self.log_test("GET Quotes without auth (should be 401)", False, error=f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("GET Quotes without auth", False, error=str(e))
    
    def test_6_admin_stats_without_auth(self):
        """Test Admin Stats API without authentication - should return 403"""
        print("\n=== Testing Admin Stats API (No Auth) ===")
        
        try:
            # Clear any existing cookies
            self.session.cookies.clear()
            
            response = self.session.get(f"{self.base_url}/admin/stats")
            
            if response.status_code in [401, 403]:
                self.log_test("GET Admin Stats without auth (should be 401/403)", True, {"message": "Correctly requires admin authentication"})
            else:
                self.log_test("GET Admin Stats without auth (should be 401/403)", False, error=f"Expected 401/403, got {response.status_code}")
                
        except Exception as e:
            self.log_test("GET Admin Stats without auth", False, error=str(e))
    
    def test_7_hidden_emails_without_auth(self):
        """Test Hidden Emails API without authentication - should return 403"""
        print("\n=== Testing Hidden Emails API (No Auth) ===")
        
        try:
            # Clear any existing cookies
            self.session.cookies.clear()
            
            response = self.session.get(f"{self.base_url}/hidden-emails")
            
            if response.status_code in [401, 403]:
                self.log_test("GET Hidden Emails without auth (should be 401/403)", True, {"message": "Correctly requires admin authentication"})
            else:
                self.log_test("GET Hidden Emails without auth (should be 401/403)", False, error=f"Expected 401/403, got {response.status_code}")
                
        except Exception as e:
            self.log_test("GET Hidden Emails without auth", False, error=str(e))
    
    def test_8_seed_data_verification(self):
        """Test that seed data was properly loaded"""
        print("\n=== Testing Seed Data Verification ===")
        
        try:
            # Test props count
            props_response = self.session.get(f"{self.base_url}/props")
            categories_response = self.session.get(f"{self.base_url}/categories")
            
            props_success = props_response.status_code == 200 and len(props_response.json()) == 12
            cats_success = categories_response.status_code == 200 and len(categories_response.json()) == 6
            
            if props_success and cats_success:
                self.log_test("Seed Data Verification (12 props, 6 categories)", True, {
                    "props_count": len(props_response.json()),
                    "categories_count": len(categories_response.json())
                })
            else:
                self.log_test("Seed Data Verification", False, error=f"Props: {len(props_response.json()) if props_response.status_code == 200 else 'Error'}, Categories: {len(categories_response.json()) if categories_response.status_code == 200 else 'Error'}")
                
        except Exception as e:
            self.log_test("Seed Data Verification", False, error=str(e))
    
    def test_9_api_root_endpoint(self):
        """Test API root endpoint"""
        print("\n=== Testing API Root Endpoint ===")
        
        try:
            response = self.session.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                data = response.json()
                if "Hangar API" in data.get("message", ""):
                    self.log_test("API Root Endpoint", True, data)
                else:
                    self.log_test("API Root Endpoint", False, error="Unexpected response format")
            else:
                self.log_test("API Root Endpoint", False, error=f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("API Root Endpoint", False, error=str(e))
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🧪 Starting Hangar Backend API Tests")
        print(f"🎯 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests in priority order
        self.test_9_api_root_endpoint()
        self.test_8_seed_data_verification()
        self.test_1_user_registration()
        self.test_2_authentication()
        self.test_3_props_api()
        self.test_4_categories_api()
        self.test_5_quotes_api_without_auth()
        self.test_6_admin_stats_without_auth()
        self.test_7_hidden_emails_without_auth()
        
        print("\n" + "=" * 60)
        print("🏁 Backend API Testing Complete")

if __name__ == "__main__":
    tester = HangarAPITester()
    tester.run_all_tests()