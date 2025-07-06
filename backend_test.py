#!/usr/bin/env python3
import requests
import json
import sys
import time
from typing import Dict, Any, List, Optional

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://609c109b-7384-4b09-b1a9-ee2b1ceaeec2.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

# Test data
SAMPLE_BUNDLE = {
    "bundle_name": "Cozy Winter Bundle",
    "tone": "warm",
    "items": [
        {"title": "Wool Scarf", "description": "Soft merino wool", "price": "25.00"},
        {"title": "Hot Chocolate Mix", "description": "Artisan blend", "price": "12.00"}
    ]
}

INVALID_BUNDLE_NO_NAME = {
    "bundle_name": "",
    "tone": "warm",
    "items": [
        {"title": "Wool Scarf", "description": "Soft merino wool", "price": "25.00"}
    ]
}

INVALID_BUNDLE_NO_ITEMS = {
    "bundle_name": "Empty Bundle",
    "tone": "warm",
    "items": []
}

INVALID_BUNDLE_EMPTY_ITEMS = {
    "bundle_name": "Invalid Bundle",
    "tone": "warm",
    "items": [{"title": "", "description": "", "price": ""}]
}

class TestResult:
    def __init__(self, name: str):
        self.name = name
        self.passed = False
        self.error = None
        self.response = None
        self.status_code = None
        
    def set_passed(self, response):
        self.passed = True
        self.response = response
        self.status_code = response.status_code
        
    def set_failed(self, error, response=None):
        self.passed = False
        self.error = error
        if response:
            self.response = response
            self.status_code = response.status_code

def print_separator():
    print("=" * 80)

def print_test_header(name: str):
    print_separator()
    print(f"TEST: {name}")
    print_separator()

def print_test_result(result: TestResult):
    status = "PASSED" if result.passed else "FAILED"
    print(f"RESULT: {status}")
    
    if result.status_code:
        print(f"STATUS CODE: {result.status_code}")
    
    if not result.passed and result.error:
        print(f"ERROR: {result.error}")
    
    if result.response:
        try:
            if hasattr(result.response, 'json'):
                response_data = result.response.json()
                print("RESPONSE:")
                print(json.dumps(response_data, indent=2))
            elif hasattr(result.response, 'text'):
                print("RESPONSE:")
                print(result.response.text[:500])  # Limit long responses
        except Exception as e:
            print(f"Could not parse response: {e}")
    
    print_separator()
    print()

def test_health_check() -> TestResult:
    """Test the API health check endpoint"""
    test = TestResult("API Health Check")
    print_test_header(test.name)
    
    try:
        response = requests.get(f"{API_URL}/")
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "running" in data["message"].lower():
                test.set_passed(response)
            else:
                test.set_failed("Response doesn't contain expected 'running' message", response)
        else:
            test.set_failed(f"Unexpected status code: {response.status_code}", response)
    
    except Exception as e:
        test.set_failed(str(e))
    
    print_test_result(test)
    return test

def test_generate_copy() -> TestResult:
    """Test the generate copy endpoint with valid data"""
    test = TestResult("Copy Generation")
    print_test_header(test.name)
    
    try:
        response = requests.post(
            f"{API_URL}/generate-copy",
            json=SAMPLE_BUNDLE
        )
        
        if response.status_code == 200:
            data = response.json()
            # Check if the response has the expected structure
            required_fields = ["title", "pitch", "bullets", "instagram"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                # Check if bullets is a list
                if isinstance(data["bullets"], list):
                    test.set_passed(response)
                else:
                    test.set_failed("'bullets' field is not a list", response)
            else:
                test.set_failed(f"Response missing required fields: {', '.join(missing_fields)}", response)
        else:
            test.set_failed(f"Unexpected status code: {response.status_code}", response)
    
    except Exception as e:
        test.set_failed(str(e))
    
    print_test_result(test)
    return test

def test_copy_history() -> TestResult:
    """Test the copy history endpoint"""
    test = TestResult("Copy History")
    print_test_header(test.name)
    
    try:
        response = requests.get(f"{API_URL}/copy-history")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                test.set_passed(response)
            else:
                test.set_failed("Response is not a list", response)
        else:
            test.set_failed(f"Unexpected status code: {response.status_code}", response)
    
    except Exception as e:
        test.set_failed(str(e))
    
    print_test_result(test)
    return test

def test_error_handling_no_name() -> TestResult:
    """Test error handling with missing bundle name"""
    test = TestResult("Error Handling - No Bundle Name")
    print_test_header(test.name)
    
    try:
        response = requests.post(
            f"{API_URL}/generate-copy",
            json=INVALID_BUNDLE_NO_NAME
        )
        
        if response.status_code == 400:
            test.set_passed(response)
        else:
            test.set_failed(f"Expected status code 400, got {response.status_code}", response)
    
    except Exception as e:
        test.set_failed(str(e))
    
    print_test_result(test)
    return test

def test_error_handling_no_items() -> TestResult:
    """Test error handling with no items"""
    test = TestResult("Error Handling - No Items")
    print_test_header(test.name)
    
    try:
        response = requests.post(
            f"{API_URL}/generate-copy",
            json=INVALID_BUNDLE_NO_ITEMS
        )
        
        if response.status_code == 400:
            test.set_passed(response)
        else:
            test.set_failed(f"Expected status code 400, got {response.status_code}", response)
    
    except Exception as e:
        test.set_failed(str(e))
    
    print_test_result(test)
    return test

def test_error_handling_empty_items() -> TestResult:
    """Test error handling with empty item titles"""
    test = TestResult("Error Handling - Empty Item Titles")
    print_test_header(test.name)
    
    try:
        response = requests.post(
            f"{API_URL}/generate-copy",
            json=INVALID_BUNDLE_EMPTY_ITEMS
        )
        
        if response.status_code == 400:
            test.set_passed(response)
        else:
            test.set_failed(f"Expected status code 400, got {response.status_code}", response)
    
    except Exception as e:
        test.set_failed(str(e))
    
    print_test_result(test)
    return test

def test_claude_integration() -> TestResult:
    """Test Claude AI integration by checking if generated copy matches the tone"""
    test = TestResult("Claude Integration")
    print_test_header(test.name)
    
    try:
        # Create a bundle with a specific tone
        warm_bundle = {
            "bundle_name": "Cozy Winter Bundle",
            "tone": "warm",
            "items": [
                {"title": "Wool Scarf", "description": "Soft merino wool", "price": "25.00"},
                {"title": "Hot Chocolate Mix", "description": "Artisan blend", "price": "12.00"}
            ]
        }
        
        response = requests.post(
            f"{API_URL}/generate-copy",
            json=warm_bundle
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if the response has the expected structure
            required_fields = ["title", "pitch", "bullets", "instagram"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                # Check if the content seems to match the warm tone
                # This is subjective, but we can look for certain keywords
                warm_keywords = ["cozy", "warm", "comfort", "snug", "soft", "nurturing", "heartfelt"]
                
                # Combine all text fields for keyword search
                all_text = data["title"] + " " + data["pitch"] + " " + " ".join(data["bullets"]) + " " + data["instagram"]
                all_text = all_text.lower()
                
                # Check if any warm keywords are present
                found_keywords = [keyword for keyword in warm_keywords if keyword in all_text]
                
                if found_keywords:
                    test.set_passed(response)
                else:
                    test.set_failed("Generated copy doesn't seem to match the 'warm' tone", response)
            else:
                test.set_failed(f"Response missing required fields: {', '.join(missing_fields)}", response)
        else:
            test.set_failed(f"Unexpected status code: {response.status_code}", response)
    
    except Exception as e:
        test.set_failed(str(e))
    
    print_test_result(test)
    return test

def run_all_tests():
    """Run all tests and return results"""
    print("Starting BundlePitch.ai Backend API Tests")
    print(f"API URL: {API_URL}")
    print_separator()
    
    results = []
    
    # Basic health check
    results.append(test_health_check())
    
    # Copy generation
    results.append(test_generate_copy())
    
    # Copy history
    results.append(test_copy_history())
    
    # Error handling tests
    results.append(test_error_handling_no_name())
    results.append(test_error_handling_no_items())
    results.append(test_error_handling_empty_items())
    
    # Claude integration
    results.append(test_claude_integration())
    
    # Print summary
    print_separator()
    print("TEST SUMMARY")
    print_separator()
    
    passed = [r for r in results if r.passed]
    failed = [r for r in results if not r.passed]
    
    for result in results:
        status = "✅ PASSED" if result.passed else "❌ FAILED"
        print(f"{status}: {result.name}")
    
    print_separator()
    print(f"TOTAL: {len(results)}, PASSED: {len(passed)}, FAILED: {len(failed)}")
    print_separator()
    
    return results

if __name__ == "__main__":
    run_all_tests()