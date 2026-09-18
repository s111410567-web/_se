import java.util.ArrayList;
import java.util.Scanner;

public class SchoolSystem {

    static Scanner scanner = new Scanner(System.in);

    // ===== 學生資料 =====
    static String studentId = "111410567";
    static String studentName = "學生";
    static String department = "資訊工程學系";
    static String grade = "大二";
    static String password = "1234";

    // ===== 課程資料 =====
    static String[] courseCodes = {
            "CS201",
            "EE201",
            "CS202",
            "CS203",
            "CS204",
            "CS205",
            "GE101"
    };

    static String[] courses = {
            "計算機結構",
            "電路學",
            "資訊系統管理",
            "TCP 協定",
            "現代程式語言",
            "現代軟體工程",
            "性別教育與生活"
    };

    static int[] credits = {
            3,
            3,
            3,
            3,
            3,
            3,
            2
    };

    static String[] teachers = {
            "陳老師",
            "王老師",
            "李老師",
            "林老師",
            "張老師",
            "黃老師",
            "吳老師"
    };

    static String[] times = {
            "星期四 2-4",
            "星期二 2-4",
            "星期一 5-7",
            "星期三 2-4",
            "星期二 5-7",
            "星期五 2-4",
            "星期四 7-8"
    };

    static ArrayList<Integer> selectedCourses = new ArrayList<>();

    static final int MAX_CREDITS = 25;

    public static void main(String[] args) {

        System.out.println("=================================");
        System.out.println("        金門大學校務系統");
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

                case "6":
                    showCredits();
                    break;

                case "7":
                    changePassword();
                    break;

                case "0":
                    System.out.println("已登出校務系統。");
                    return;

                default:
                    System.out.println("輸入錯誤，請重新選擇。");
            }
        }
    }

    // ===== 登入 =====
    public static boolean login() {

        System.out.println("\n--- 學生登入 ---");

        int attempts = 3;

        while (attempts > 0) {

            System.out.print("請輸入學號：");
            String inputId = scanner.nextLine();

            System.out.print("請輸入密碼：");
            String inputPassword = scanner.nextLine();

            if (inputId.equals(studentId) && inputPassword.equals(password)) {
                System.out.println("\n登入成功！");
                System.out.println("歡迎，" + studentName + "！");
                return true;
            }

            attempts--;

            System.out.println("學號或密碼錯誤。");

            if (attempts > 0) {
                System.out.println("剩餘嘗試次數：" + attempts);
            }
        }

        return false;
    }

    // ===== 主選單 =====
    public static void showMenu() {

        System.out.println("\n=================================");
        System.out.println("          校務系統選單");
        System.out.println("=================================");
        System.out.println("1. 查看個人資料");
        System.out.println("2. 查看所有課程");
        System.out.println("3. 選課");
        System.out.println("4. 查看已選課程");
        System.out.println("5. 退選課程");
        System.out.println("6. 查看目前學分");
        System.out.println("7. 修改密碼");
        System.out.println("0. 登出");
        System.out.println("=================================");
    }

    // ===== 個人資料 =====
    public static void showStudentInfo() {

        System.out.println("\n--- 個人資料 ---");
        System.out.println("姓名：" + studentName);
        System.out.println("學號：" + studentId);
        System.out.println("科系：" + department);
        System.out.println("年級：" + grade);
        System.out.println("目前學分：" + calculateCredits());
    }

    // ===== 顯示所有課程 =====
    public static void showCourses() {

        System.out.println("\n================ 可選課程 ================");

        System.out.printf(
                "%-4s %-8s %-12s %-4s %-8s %-15s%n",
                "編號", "課程代碼", "課程名稱", "學分", "老師", "上課時間"
        );

        System.out.println("------------------------------------------------------------");

        for (int i = 0; i < courses.length; i++) {

            String selectedMark = "";

            if (selectedCourses.contains(i)) {
                selectedMark = " [已選]";
            }

            System.out.printf(
                    "%-4d %-8s %-12s %-4d %-8s %-15s%s%n",
                    (i + 1),
                    courseCodes[i],
                    courses[i],
                    credits[i],
                    teachers[i],
                    times[i],
                    selectedMark
            );
        }
    }

    // ===== 選課 =====
    public static void selectCourse() {

        showCourses();

        System.out.print("\n請輸入想選的課程編號：");

        try {

            int number = Integer.parseInt(scanner.nextLine());

            if (number < 1 || number > courses.length) {
                System.out.println("課程編號不存在。");
                return;
            }

            int index = number - 1;

            if (selectedCourses.contains(index)) {
                System.out.println("你已經選過這門課。");
                return;
            }

            int currentCredits = calculateCredits();
            int newCredits = currentCredits + credits[index];

            if (newCredits > MAX_CREDITS) {
                System.out.println("選課失敗！");
                System.out.println("超過最高 " + MAX_CREDITS + " 學分。");
                return;
            }

            selectedCourses.add(index);

            System.out.println("選課成功！");
            System.out.println("課程：" + courses[index]);
            System.out.println("學分：" + credits[index]);
            System.out.println("目前總學分：" + calculateCredits());

        } catch (NumberFormatException e) {
            System.out.println("請輸入正確的數字。");
        }
    }

    // ===== 顯示已選課程 =====
    public static void showSelectedCourses() {

        System.out.println("\n--- 已選課程 ---");

        if (selectedCourses.isEmpty()) {
            System.out.println("目前尚未選擇任何課程。");
            return;
        }

        for (int i = 0; i < selectedCourses.size(); i++) {

            int courseIndex = selectedCourses.get(i);

            System.out.println(
                    (i + 1) + ". "
                    + courseCodes[courseIndex] + " "
                    + courses[courseIndex]
                    + " / "
                    + credits[courseIndex] + " 學分"
                    + " / "
                    + teachers[courseIndex]
                    + " / "
                    + times[courseIndex]
            );
        }

        System.out.println("目前總學分：" + calculateCredits());
    }

    // ===== 退選 =====
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

            int removedIndex = selectedCourses.remove(number - 1);

            System.out.println("退選成功！");
            System.out.println("已退選：" + courses[removedIndex]);
            System.out.println("目前總學分：" + calculateCredits());

        } catch (NumberFormatException e) {
            System.out.println("請輸入正確的數字。");
        }
    }

    // ===== 計算學分 =====
    public static int calculateCredits() {

        int total = 0;

        for (int index : selectedCourses) {
            total += credits[index];
        }

        return total;
    }

    // ===== 顯示學分 =====
    public static void showCredits() {

        int total = calculateCredits();

        System.out.println("\n--- 學分資訊 ---");
        System.out.println("目前學分：" + total);
        System.out.println("最高可選學分：" + MAX_CREDITS);
        System.out.println("剩餘可選學分：" + (MAX_CREDITS - total));
    }

    // ===== 修改密碼 =====
    public static void changePassword() {

        System.out.println("\n--- 修改密碼 ---");

        System.out.print("請輸入目前密碼：");
        String oldPassword = scanner.nextLine();

        if (!oldPassword.equals(password)) {
            System.out.println("目前密碼錯誤。");
            return;
        }

        System.out.print("請輸入新密碼：");
        String newPassword = scanner.nextLine();

        System.out.print("請再次輸入新密碼：");
        String confirmPassword = scanner.nextLine();

        if (!newPassword.equals(confirmPassword)) {
            System.out.println("兩次輸入的密碼不一致。");
            return;
        }

        if (newPassword.length() < 4) {
            System.out.println("密碼至少需要 4 個字元。");
            return;
        }

        password = newPassword;

        System.out.println("密碼修改成功！");
    }
}