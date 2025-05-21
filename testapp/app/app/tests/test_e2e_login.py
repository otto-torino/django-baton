import time

from django.test import TestCase
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from testapp.app.app.tests.utils import make_driver

import os

os.environ["WDM_LOG_LEVEL"] = "0"


class TestBatonLogin(TestCase):
    def setUp(self):
        self.driver = make_driver()

    def tearDown(self):
        self.driver.quit()

    def test_form(self):
        self.driver.get("http://localhost:8000/admin")
        # wait for page to load
        try:
            element_present = EC.presence_of_element_located((By.ID, "header"))
            WebDriverWait(self.driver, 10).until(element_present)
        except TimeoutException:
            print("Timed out waiting for page to load")

        time.sleep(1)
        header_field = self.driver.find_element(By.ID, "header")
        self.assertEqual(header_field.text, "Baton Test App")

        username_field = self.driver.find_element(By.ID, "id_username")
        password_field = self.driver.find_element(By.ID, "id_password")
        button = self.driver.find_element(By.CSS_SELECTOR, "input[type=submit]")
        self.assertEqual(password_field.is_displayed(), True)
        self.assertEqual(username_field.is_displayed(), True)
        self.assertEqual(button.is_displayed(), True)

        username_field.send_keys("admin")
        time.sleep(1)
        password_field.send_keys("admin")
        time.sleep(1)
        button.click()
        time.sleep(1)
        self.assertEqual(self.driver.current_url, "http://localhost:8000/admin/")
