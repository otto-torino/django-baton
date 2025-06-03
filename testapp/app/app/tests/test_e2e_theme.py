import time

from django.test import TestCase
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from .utils import element_has_css_class, make_driver

import os

os.environ["WDM_LOG_LEVEL"] = "0"


class TestBatonTheme(TestCase):
    def setUp(self):
        self.driver = make_driver()
        self.driver.set_window_size(1920, 1280)
        self.driver.implicitly_wait(10)
        self.login()
        time.sleep(2)

    def tearDown(self):
        self.driver.quit()

    def login(self):
        self.driver.get("http://localhost:8000/admin")
        username_field = self.driver.find_element(By.ID, "id_username")
        password_field = self.driver.find_element(By.ID, "id_password")
        button = self.driver.find_element(By.CSS_SELECTOR, "input[type=submit]")

        username_field.send_keys("admin")
        time.sleep(1)
        password_field.send_keys("admin")
        time.sleep(1)
        button.click()

    def test_theme(self):
        # Wait until baton is ready
        wait = WebDriverWait(self.driver, 10)
        wait.until(element_has_css_class((By.TAG_NAME, "body"), "baton-ready"))
        wait = WebDriverWait(self.driver, 1000)

        # site title
        html = self.driver.find_element(By.CSS_SELECTOR, "html")
        self.assertTrue(html.get_attribute("data-bs-theme") in ["light", "dark"])
