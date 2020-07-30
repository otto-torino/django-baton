import time
from django.test import TestCase
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

from .utils import element_has_css_class

import os
os.environ['WDM_LOG_LEVEL'] = '0'


class TestBatonMenu(TestCase):
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

    def test_menu(self):
        # Wait until baton is ready
        wait = WebDriverWait(self.driver, 10)
        wait.until(element_has_css_class((By.TAG_NAME, 'body'), "baton-ready"))
        time.sleep(2)
        navbar = self.driver.find_element_by_class_name('sidebar-menu')
        self.assertEqual(navbar.is_displayed(), True)
        root_voices = navbar.find_elements_by_css_selector('.depth-0 > li')

        gravatart_icon = self.driver.find_element_by_class_name('gravatar-icon')
        self.assertEqual(gravatart_icon.is_displayed(), True)

        view_site_link = self.driver.find_element_by_class_name('view-site')
        self.assertEqual(view_site_link.is_displayed(), True)

        change_password_link = self.driver.find_element_by_class_name('password')
        self.assertEqual(change_password_link.is_displayed(), True)

        logout_link = self.driver.find_element_by_class_name('logout')
        self.assertEqual(logout_link.is_displayed(), True)

        # system title voice
        self.assertEqual(root_voices[0].get_attribute('innerText'), 'SYSTEM')
        self.assertEqual('title' in root_voices[0].get_attribute('class').split(), True)
        self.assertEqual(len(root_voices), 6)

        # authentication app voice
        self.assertEqual('app' in root_voices[1].get_attribute('class').split(), True)
        self.assertEqual(root_voices[1].find_element_by_class_name('fa-lock').is_displayed(), True)
        self.assertEqual(root_voices[1].find_element_by_class_name('has-children').get_attribute('innerText'), 'Authentication')
        auth_children = root_voices[1].find_elements_by_css_selector('.depth-1 li')
        self.assertEqual(len(auth_children), 2)
        self.assertEqual(auth_children[0].is_displayed(), False)
        self.assertEqual(auth_children[0].find_element_by_tag_name('a').get_attribute('href'), 'http://localhost:8000/admin/auth/user/')
        self.assertEqual(auth_children[1].is_displayed(), False)
        self.assertEqual(auth_children[1].find_element_by_tag_name('a').get_attribute('href'), 'http://localhost:8000/admin/auth/group/')
        # open submenu on click
        root_voices[1].click()
        self.assertEqual(auth_children[0].is_displayed(), True)
        self.assertEqual(auth_children[0].find_element_by_tag_name('a').get_attribute('innerText'), 'Users')
        self.assertEqual(auth_children[1].is_displayed(), True)
        self.assertEqual(auth_children[1].find_element_by_tag_name('a').get_attribute('innerText'), 'Groups')

        # news menu title volice
        self.assertEqual(root_voices[4].find_element_by_css_selector('span.has-children').get_attribute('innerText'), 'NEWS')
        self.assertEqual('title' in root_voices[4].get_attribute('class').split(), True)
        self.assertEqual('default-open' in root_voices[4].get_attribute('class').split(), True)
        news_children = root_voices[4].find_elements_by_css_selector('.depth-1 li')
        self.assertEqual(len(news_children), 2)
        self.assertEqual(news_children[0].is_displayed(), True)
        self.assertEqual(news_children[0].find_element_by_tag_name('a').get_attribute('href'), 'http://localhost:8000/admin/news/category/')
        self.assertEqual(news_children[1].is_displayed(), True)
        self.assertEqual(news_children[1].find_element_by_tag_name('a').get_attribute('href'), 'http://localhost:8000/admin/news/news/')
        # hide subvoices after click
        root_voices[4].find_element_by_css_selector('span').click()
        self.assertEqual(news_children[0].is_displayed(), False)
        self.assertEqual(news_children[1].is_displayed(), False)

        # tools voice
        self.assertEqual(root_voices[5].find_element_by_css_selector('span.has-children').get_attribute('innerText'), 'TOOLS')
