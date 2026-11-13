
import unittest
from unittest.mock import patch, MagicMock
import urllib.error

from website_checker import check_website


class TestWebsiteChecker(unittest.TestCase):

    @patch("website_checker.urllib.request.urlopen")
    def test_success(self, mock_urlopen):
        response = MagicMock()
        response.getcode.return_value = 200
        mock_urlopen.return_value.__enter__.return_value = response

        result = check_website("https://example.com")

        self.assertEqual(result["status"], "正常")
        self.assertEqual(result["status_code"], 200)
        self.assertIsNone(result["error"])

    @patch("website_checker.urllib.request.urlopen")
    def test_http_404(self, mock_urlopen):
        mock_urlopen.side_effect = urllib.error.HTTPError(
            "https://example.com",
            404,
            "Not Found",
            {},
            None
        )

        result = check_website("https://example.com")

        self.assertEqual(result["status"], "異常")
        self.assertEqual(result["status_code"], 404)

    @patch("website_checker.urllib.request.urlopen")
    def test_connection_error(self, mock_urlopen):
        mock_urlopen.side_effect = urllib.error.URLError(
            "Connection failed"
        )

        result = check_website("https://example.com")

        self.assertEqual(result["status"], "無法連線")
        self.assertIsNone(result["status_code"])

    @patch("website_checker.urllib.request.urlopen")
    def test_auto_https(self, mock_urlopen):
        response = MagicMock()
        response.getcode.return_value = 200
        mock_urlopen.return_value.__enter__.return_value = response

        result = check_website("example.com")

        self.assertEqual(result["url"], "https://example.com")


if __name__ == "__main__":
    unittest.main()
