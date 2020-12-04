import os
import time

from django.test import TestCase
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

from .utils import element_has_css_class

os.environ['WDM_LOG_LEVEL'] = '0'


class TestBatonClIncludes(TestCase):
    def setUp(self):
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-extensions')
        chrome_options.add_argument('--disable-dev-shm-usage')
        self.driver = webdriver.Chrome(
            ChromeDriverManager().install(),
            options=chrome_options,
        )
        self.driver.set_window_size(1920, 1080)
        self.driver.implicitly_wait(10)
        self.login()

    def tearDown(self):
        self.driver.quit()

    def login(self):
        self.driver.get('http://localhost:8000/admin/news/news/')
        username_field = self.driver.find_element_by_id("id_username")
        password_field = self.driver.find_element_by_id("id_password")
        button = self.driver.find_element_by_css_selector('input[type=submit]')

        username_field.send_keys('admin')
        time.sleep(1)
        password_field.send_keys('admin')
        time.sleep(1)
        button.click()

    def test_includes(self):
        # Wait until baton is ready
        wait = WebDriverWait(self.driver, 10)
        wait.until(element_has_css_class((By.TAG_NAME, 'body'), "baton-ready"))
        time.sleep(2)

        # tabs number
        include = self.driver.find_element_by_css_selector(
            '.baton-cl-include-top')
        self.assertEqual(include.is_displayed(), True)
        parent = include.find_element_by_xpath('..')
        self.assertEqual(parent.get_attribute('id'), 'changelist-form')
