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


class TestBatonInputFilter(TestCase):
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
        self.driver.get('http://localhost:8000/admin/news/news/3/change')
        username_field = self.driver.find_element_by_id("id_username")
        password_field = self.driver.find_element_by_id("id_password")
        button = self.driver.find_element_by_css_selector('input[type=submit]')

        username_field.send_keys('admin')
        time.sleep(1)
        password_field.send_keys('admin')
        time.sleep(1)
        button.click()

    def test_tabs(self):
        # Wait until baton is ready
        wait = WebDriverWait(self.driver, 10)
        wait.until(element_has_css_class((By.TAG_NAME, 'body'), "baton-ready"))
        time.sleep(2)

        # tabs number
        tabs_li = self.driver.find_elements_by_css_selector(
            '.nav-tabs .nav-item')
        self.assertEqual(len(tabs_li), 5)
        self.assertEqual(tabs_li[0].get_attribute('innerText'), 'Dates')
        self.assertEqual(tabs_li[1].get_attribute('innerText'), 'Main')
        self.assertEqual(tabs_li[2].get_attribute('innerText'), 'Flags')
        self.assertEqual(tabs_li[3].get_attribute('innerText'), 'Attachments')
        self.assertEqual(tabs_li[4].get_attribute('innerText'), 'Videos')

        # order
        input_date = self.driver.find_element_by_id('id_date')
        self.assertEqual(input_date.is_displayed(), False)
        tabs_li[0].click()  # change tab flags
        self.assertEqual(input_date.is_displayed(), True)

        # tabs navigation
        input_share = self.driver.find_element_by_id('id_share')
        description_att = self.driver.find_element_by_css_selector('.tab-fs-attachments .description')
        self.assertEqual(input_share.is_displayed(), False)
        self.assertEqual(description_att.is_displayed(), False)
        tabs_li[2].click()  # change tab flags
        self.assertEqual(input_share.is_displayed(), True)
        self.assertEqual(description_att.is_displayed(), False)
        tabs_li[3].click()  # change tab attachments
        self.assertEqual(input_share.is_displayed(), False)

        # fieldset description
        self.assertEqual(description_att.is_displayed(), True)
        self.assertEqual(description_att.get_attribute('innerText'), 'Add as many attachments as you want')

        # tabs groups && inlines
        attachments_summary = self.driver.find_element_by_id('id_attachments_summary')
        self.assertEqual(attachments_summary.is_displayed(), True)
        inlines = self.driver.find_element_by_css_selector('#group-fs-attachments--inline-attachments .inline-related .module')
        inline_title = inlines.find_element_by_tag_name('h2')
        attachments_rows = inlines.find_elements_by_css_selector('.dynamic-attachments')
        self.assertEqual(inline_title.is_displayed(), True)
        self.assertEqual(inline_title.get_attribute('innerText'), 'Attachments')
        self.assertEqual(len(attachments_rows), 2)
        add_button = inlines.find_element_by_css_selector('.add-row a')
        self.assertEqual(add_button.is_displayed(), True)
        add_button.click()
        attachments_rows = inlines.find_elements_by_css_selector('.dynamic-attachments')
        self.assertEqual(len(attachments_rows), 3)
