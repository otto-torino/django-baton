import os
import time

from django.test import TestCase 
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from .utils import element_has_css_class, make_driver

os.environ['WDM_LOG_LEVEL'] = '0'

class TestBatonTabs(TestCase):
    def setUp(self):
        self.driver = make_driver()
        self.driver.set_window_size(1920, 2080)
        self.driver.implicitly_wait(10)
        self.login()

    def tearDown(self):
        self.driver.quit()

    def login(self):
        self.driver.get('http://localhost:8000/admin/news/news/1/change')
        username_field = self.driver.find_element(By.ID, "id_username")
        password_field = self.driver.find_element(By.ID, "id_password")
        button = self.driver.find_element(By.CSS_SELECTOR, 'input[type=submit]')

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
        tabs_li = self.driver.find_elements(
            By.CSS_SELECTOR,
            '.nav-tabs .nav-item')
        self.assertEqual(len(tabs_li), 6)
        self.assertEqual(tabs_li[0].get_attribute('innerText'), 'Dates')
        self.assertEqual(tabs_li[1].get_attribute('innerText'), 'Main')
        self.assertEqual(tabs_li[2].get_attribute('innerText'), 'Flags')
        self.assertEqual(tabs_li[3].get_attribute('innerText'), 'Attachments')
        self.assertEqual(tabs_li[4].get_attribute('innerText'), 'Videos')
        self.assertEqual(tabs_li[5].get_attribute('innerText'), 'Activities')

        # order
        input_date = self.driver.find_element(By.ID, 'id_date')
        self.assertEqual(input_date.is_displayed(), False)
        tabs_li[0].click()  # change tab flags
        time.sleep(2)  # fade
        self.assertEqual(input_date.is_displayed(), True)

        # tabs navigation
        input_share = self.driver.find_element(By.ID, 'id_share')
        description_att = self.driver.find_element(By.CSS_SELECTOR, '.tab-fs-attachments .description')
        self.assertEqual(input_share.is_displayed(), False)
        self.assertEqual(description_att.is_displayed(), False)
        tabs_li[2].click()  # change tab flags
        time.sleep(2)  # fade

        self.assertEqual(input_share.is_displayed(), True)
        self.assertEqual(description_att.is_displayed(), False)
        tabs_li[3].click()  # change tab attachments
        time.sleep(2)  # fade
        self.assertEqual(input_share.is_displayed(), False)

        # fieldset description
        self.assertEqual(description_att.is_displayed(), True)
        self.assertEqual(description_att.get_attribute('innerText'), 'Add as many attachments as you want')

        # tabs groups && inlines
        attachments_summary = self.driver.find_element(By.ID, 'id_attachments_summary_en')
        self.assertEqual(attachments_summary.is_displayed(), True)
        inlines = self.driver.find_element(By.CSS_SELECTOR, '#group-fs-attachments--inline-attachments .inline-related .module')
        inline_title = inlines.find_element(By.TAG_NAME, 'h2')
        attachments_rows = inlines.find_elements(By.CSS_SELECTOR, '.dynamic-attachments')
        self.assertEqual(inline_title.is_displayed(), True)
        self.assertEqual(inline_title.get_attribute('innerText'), 'Attachments')
        self.assertEqual(len(attachments_rows), 2)
        add_button = inlines.find_element(By.CSS_SELECTOR, '.add-row a')
        self.assertEqual(add_button.is_displayed(), True)
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(3)  # fade
        # try except because first click will fail in selenium
        try:
            add_button.click()
        except:
            add_button.click()
        time.sleep(10)
        attachments_rows = inlines.find_elements(By.CSS_SELECTOR, '.dynamic-attachments')
        self.assertEqual(len(attachments_rows), 3)

    def test_detect_tab_error(self):
        # Wait until baton is ready
        wait = WebDriverWait(self.driver, 10)
        wait.until(element_has_css_class((By.TAG_NAME, 'body'), "baton-ready"))
        time.sleep(2)

        # tabs number
        tabs_li = self.driver.find_elements(
            By.CSS_SELECTOR,
            '.nav-tabs .nav-item')

        tabs_li[3].click()  # change tab attachments
        time.sleep(2)  # fade

        field = self.driver.find_element(By.ID, "id_attachments-1-caption")
        button = self.driver.find_element(By.CSS_SELECTOR, 'input[type=submit][name=_continue]')
        time.sleep(1)
        field.send_keys('test')
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(1)
        try:
            button.click()
        except:
            button.click()

        wait = WebDriverWait(self.driver, 10)
        wait.until(element_has_css_class((By.TAG_NAME, 'body'), "baton-ready"))
        time.sleep(2)
        input_share = self.driver.find_element(By.ID, 'id_share')
        self.assertEqual(input_share.is_displayed(), False)
        description_att = self.driver.find_element(By.CSS_SELECTOR, '.tab-fs-attachments .description')
        self.assertEqual(description_att.is_displayed(), True)
        self.assertEqual(description_att.get_attribute('innerText'), 'Add as many attachments as you want')
