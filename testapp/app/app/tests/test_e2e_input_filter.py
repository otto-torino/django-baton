import os
import time

from django.test import TestCase
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

from .utils import element_has_css_class

os.environ['WDM_LOG_LEVEL'] = '0'


class TestBatonInputFilter(TestCase):
    def setUp(self):
        service = Service(ChromeDriverManager(version='114.0.5735.90').install())
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-extensions')
        chrome_options.add_argument('--disable-dev-shm-usage')
        self.driver = webdriver.Chrome(
            service=service,
            options=chrome_options,
        )
        self.driver.set_window_size(1920, 1080)
        self.driver.implicitly_wait(10)
        self.login()

    def tearDown(self):
        self.driver.quit()

    def login(self):
        self.driver.get('http://localhost:8000/admin/news/news/')
        username_field = self.driver.find_element(By.ID, "id_username")
        password_field = self.driver.find_element(By.ID, "id_password")
        button = self.driver.find_element(By.CSS_SELECTOR, 'input[type=submit]')

        username_field.send_keys('admin')
        time.sleep(1)
        password_field.send_keys('admin')
        time.sleep(1)
        button.click()

    def test_filter(self):
        # Wait until baton is ready
        wait = WebDriverWait(self.driver, 10)
        wait.until(element_has_css_class((By.TAG_NAME, 'body'), "baton-ready"))
        time.sleep(2)
        rows = self.driver.find_elements(By.CSS_SELECTOR, '#result_list tbody tr')
        self.assertEqual(len(rows), 2)
        filter_button = self.driver.find_element(By.CSS_SELECTOR, '.changelist-filter-toggler')
        filter_button.click()
        input = self.driver.find_element(By.CSS_SELECTOR, '#changelist-filter-modal li > input')
        input.send_keys('glen')
        btn = self.driver.find_element(By.CSS_SELECTOR, '.modal .btn-action')
        btn.click()
        time.sleep(1)
        rows = self.driver.find_elements(By.CSS_SELECTOR, '#result_list tbody tr')
        self.assertEqual(len(rows), 1)
