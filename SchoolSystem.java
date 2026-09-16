import java.util.ArrayList;
import java.util.Scanner;

public class SchoolSystem {

    static Scanner scanner = new Scanner(System.in);

    static String studentId = "111410567";
    static String studentName = "學生";
    static String department = "資訊工程學系";

    static String[] courses = {
            "計算機結構",
            "電路學",
            "資訊系統管理",
            "TCP 協定",
            "現代程式語言"
    };

    static ArrayList<String> selectedCourses = new ArrayList<>();

    public static void main(String[] args) {

        System.out.println("=================================");
        System.out.println("      金門大學校務系統");
        System.out.println("=================================");

        if (!login()) {
            System.out.println("登入失敗，程式結束。");
            return;
        }

        while (true) {

            showMenu();

            System.out.print("請輸入選項：");
            String choice = scanner.nextLine();

            switch (choice) {

                case "1":
                    showStudentInfo();
                    break;

                case "2":
                    showCourses();
                    break;

                case "3":
                    selectCourse();
                    break;

                case "4":
                    showSelectedCourses();
                    break;

                case "5":
                    dropCourse();
                    break;

                case "0":
                    System.out.println("已登出校務系統。");
                    return;

                default:
                    System.out.println("輸入錯誤，請重新選擇。");
            }
        }
    }

    public static boolean login() {

        System.out.println("\n--- 學生登入 ---");

        System.out.print("請輸入學號：");
        String inputId = scanner.nextLine();

        System.out.print("請輸入密碼：");
        String password = scanner.nextLine();

        if (inputId.equals(studentId) && password.equals("1234")) {
            System.out.println("\n登入成功！");
            return true;
        }

        return false;
    }

    public static void showMenu() {

        System.out.println("\n=================================");
        System.out.println("          校務系統選單");
        System.out.println("=================================");
        System.out.println("1. 查看個人資料");
        System.out.println("2. 查看所有課程");
        System.out.println("3. 選課");
        System.out.println("4. 查看已選課程");
        System.out.println("5. 退選課程");
        System.out.println("0. 登出");
        System.out.println("=================================");
    }

    public static void showStudentInfo() {

        System.out.println("\n--- 個人資料 ---");
        System.out.println("姓名：" + studentName);
        System.out.println("學號：" + studentId);
        System.out.println("科系：" + department);
    }

    public static void showCourses() {

        System.out.println("\n--- 可選課程 ---");

        for (int i = 0; i < courses.length; i++) {
            System.out.println((i + 1) + ". " + courses[i]);
        }
    }

    public static void selectCourse() {

        showCourses();

        System.out.print("請輸入想選的課程編號：");

        try {

            int number = Integer.parseInt(scanner.nextLine());

            if (number < 1 || number > courses.length) {
                System.out.println("課程編號不存在。");
                return;
            }

            String course = courses[number - 1];

            if (selectedCourses.contains(course)) {
                System.out.println("你已經選過這門課。");
            } else {
                selectedCourses.add(course);
                System.out.println("選課成功：" + course);
            }

        } catch (NumberFormatException e) {
            System.out.println("請輸入正確的數字。");
        }
    }

    public static void showSelectedCourses() {

        System.out.println("\n--- 已選課程 ---");

        if (selectedCourses.isEmpty()) {
            System.out.println("目前尚未選擇任何課程。");
            return;
        }

        for (int i = 0; i < selectedCourses.size(); i++) {
            System.out.println((i + 1) + ". " + selectedCourses.get(i));
        }
    }

    public static void dropCourse() {

        showSelectedCourses();

        if (selectedCourses.isEmpty()) {
            return;
        }

        System.out.print("請輸入想退選的課程編號：");

        try {

            int number = Integer.parseInt(scanner.nextLine());

            if (number < 1 || number > selectedCourses.size()) {
                System.out.println("課程編號不存在。");
                return;
            }

            String removedCourse = selectedCourses.remove(number - 1);

            System.out.println("退選成功：" + removedCourse);

        } catch (NumberFormatException e) {
            System.out.println("請輸入正確的數字。");
        }
    }
}