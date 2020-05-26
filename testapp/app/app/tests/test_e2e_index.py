import time

from django.test import TestCase
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

from .utils import element_has_css_class

import os
os.environ['WDM_LOG_LEVEL'] = '0'


class TestBatonIndex(TestCase):
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
        self.driver.get('http://localhost:8000/admin')
        username_field = self.driver.find_element_by_id("id_username")
        password_field = self.driver.find_element_by_id("id_password")
        button = self.driver.find_element_by_css_selector('input[type=submit]')

        username_field.send_keys('admin')
        time.sleep(1)
        password_field.send_keys('admin')
        time.sleep(1)
        button.click()

    def test_navbar(self):
        # Wait until baton is ready
        wait = WebDriverWait(self.driver, 10)
        wait.until(element_has_css_class((By.TAG_NAME, 'body'), "baton-ready"))

        # site title
        site_name = self.driver.find_element_by_css_selector("#site-name a")
        self.assertEqual(
            site_name.get_attribute('innerHTML'), 'Baton Test App')

        # user dropdown
        user_dropdown_el = self.driver.find_element_by_css_selector(
            "#user-tools .dropdown-toggle")
        user_dropdown_text = user_dropdown_el.text
        self.assertEqual(user_dropdown_text, 'admin')
        self.assertEqual(user_dropdown_el.is_displayed(), True)

        # user dropdown menu
        user_dropdown_menu = self.driver.find_elements_by_css_selector(
            "#user-tools .dropdown-menu a")
        self.assertEqual(len(user_dropdown_menu), 3)
        self.assertEqual(user_dropdown_menu[0].get_attribute('innerHTML'),
                         'View site')
        self.assertEqual(user_dropdown_menu[1].get_attribute('innerHTML'),
                         'Change password')
        self.assertEqual(user_dropdown_menu[2].get_attribute('innerHTML'),
                         'Log out')

    def test_content(self):
        # Wait until baton is ready
        wait = WebDriverWait(self.driver, 10)
        wait.until(element_has_css_class((By.TAG_NAME, 'body'), "baton-ready"))

        time.sleep(1)

        # page title
        page_title = self.driver.find_element_by_css_selector(
            "#content h1")
        self.assertEqual(page_title.get_attribute('innerHTML'), 'Baton administration')
        self.assertEqual(page_title.is_displayed(), True)

        # recent actions
        recent_actions = self.driver.find_element_by_id('recent-actions-module')
        self.assertEqual(recent_actions.is_displayed(), True)

        modules = self.driver.find_elements_by_css_selector(
            "#content-main .module")
        self.assertEqual(len(modules), 2)

    def test_footer(self):
        # Wait until baton is ready
        wait = WebDriverWait(self.driver, 10)
        wait.until(element_has_css_class((By.TAG_NAME, 'body'), "baton-ready"))

        links = self.driver.find_elements_by_css_selector(
            "#footer .col-sm-4 p")
        self.assertEqual(len(links), 3)
        # support
        self.assertEqual(links[0].find_element_by_css_selector('a').get_attribute('href'), 'mailto:mail@otto.to.it')
        self.assertEqual(links[0].get_attribute('innerText').strip(), 'Support')
        # copyright
        self.assertEqual(links[1].get_attribute('innerText').strip(), 'copyright © 2020 Otto srl')
        # powered by
        self.assertEqual(links[2].get_attribute('innerText').strip(), 'Baton Test App\nDeveloped by Otto srl')
