import os

from django.test import TestCase
from dotenv import load_dotenv
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

load_dotenv()



class TestBatonLogin(TestCase):
    def setUp(self):
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-extensions')
        chrome_options.add_argument('--disable-dev-shm-usage')
        self.driver = webdriver.Chrome(
            ChromeDriverManager().install(),
            options=chrome_options,)

    def test_form(self):
        self.driver.get('http://localhost:8000/admin')
        header_field = self.driver.find_element_by_id("header")
         # wait for page to load
        try:
            element_present = EC.presence_of_element_located(
                (By.ID, 'header'))
            WebDriverWait(self.driver, 10).until(element_present)
        except TimeoutException:
            print("Timed out waiting for page to load")
        self.assertEqual(header_field.text, 'Baton Test App')
