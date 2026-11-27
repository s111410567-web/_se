
import unittest
from datetime import datetime
from importlib import import_module

tools = import_module("04_tools")


class TestAgentTools(unittest.TestCase):

    def test_add(self):
        self.assertEqual(tools.add(25, 30), 55)

    def test_add_negative(self):
        self.assertEqual(tools.add(-5, 3), -2)

    def test_add_zero(self):
        self.assertEqual(tools.add(10, 0), 10)

    def test_multiply(self):
        self.assertEqual(tools.multiply(12, 8), 96)

    def test_multiply_negative(self):
        self.assertEqual(tools.multiply(-4, 5), -20)

    def test_multiply_zero(self):
        self.assertEqual(tools.multiply(100, 0), 0)

    def test_current_time(self):
        result = tools.get_current_time()
        datetime.strptime(result, "%Y-%m-%d %H:%M:%S")
        self.assertIsInstance(result, str)


if __name__ == "__main__":
    unittest.main(verbosity=2)
