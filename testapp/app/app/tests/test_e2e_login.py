import os
from dotenv import load_dotenv
load_dotenv()

from django.test import TestCase
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class TestBatonLogin(TestCase):
    def setUp(self):
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-extensions')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--disable-dev-shm-usage')
        self.driver = webdriver.Chrome(
            options=chrome_options, executable_path=os.getenv('CHROME_DRIVER_PATH'))

    def test_form(self):
        self.driver.get('http://localhost:8000/admin')
        header_field = self.driver.find_element_by_id("header")
        self.assertEqual(header_field.text, 'Baton Test App')
