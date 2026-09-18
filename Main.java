import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 機車保養提醒系統
 * Java 17，無第三方套件。可直接在 VS Code 執行。
 */
public class Main {
    private static final Scanner INPUT = new Scanner(System.in);
    private static final String DATA_FILE = "maintenance-data.txt";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final List<MaintenanceItem> items = new ArrayList<>();
    private static final List<MaintenanceRecord> records = new ArrayList<>();
    private static Motorcycle motorcycle = new Motorcycle("未設定", "未設定", 0);
    private static boolean running = true;

    public static void main(String[] args) {
        loadData();
        printWelcome();
        while (running) {
            showMainMenu();
            handleMainMenu(readInt("請選擇功能：", 0, 10));
        }
    }

    private static void printWelcome() {
        line('=', 62);
        System.out.println("                  機車保養提醒系統");
        line('=', 62);
        System.out.printf("車牌：%s　車款：%s　目前里程：%,d km%n",
                motorcycle.plate, motorcycle.model, motorcycle.currentMileage);
        long overdue = items.stream().filter(i -> statusOf(i).overdue).count();
        if (overdue > 0) {
            System.out.printf("⚠ 目前有 %d 個保養項目已逾期，請查看保養儀表板。%n", overdue);
        }
    }

    private static void showMainMenu() {
        System.out.println();
        line('-', 62);
        System.out.println("1. 保養儀表板          2. 更新目前里程");
        System.out.println("3. 新增保養紀錄        4. 查看／搜尋歷史紀錄");
        System.out.println("5. 保養費用統計        6. 管理保養項目與週期");
        System.out.println("7. 管理機車資料        8. 匯出 CSV 報表");
        System.out.println("9. 系統說明           10. 立即儲存資料");
        System.out.println("0. 儲存並離開");
        line('-', 62);
    }

    private static void handleMainMenu(int choice) {
        switch (choice) {
            case 1 -> showDashboard();
            case 2 -> updateMileage();
            case 3 -> addMaintenanceRecord();
            case 4 -> historyMenu();
            case 5 -> showCostStatistics();
            case 6 -> manageItems();
            case 7 -> manageMotorcycle();
            case 8 -> exportCsv();
            case 9 -> showHelp();
            case 10 -> { saveData(); success("資料已儲存。"); }
            case 0 -> { saveData(); running = false; System.out.println("資料已儲存，感謝使用！"); }
            default -> error("無效選項。");
        }
    }

    private static void showDashboard() {
        title("保養儀表板");
        System.out.printf("目前里程：%,d km%n%n", motorcycle.currentMileage);
        List<MaintenanceItem> sorted = new ArrayList<>(items);
        sorted.sort(Comparator.comparingInt(i -> statusOf(i).remaining));
        System.out.printf("%-3s %-14s %10s %10s %11s  %s%n",
                "編號", "保養項目", "上次里程", "週期", "下次里程", "狀態");
        line('-', 70);
        for (MaintenanceItem item : sorted) {
            ItemStatus s = statusOf(item);
            System.out.printf("%-3d %-14s %,8d km %,8d km %,9d km  %s%n",
                    item.id, cut(item.name, 12), item.lastMileage, item.intervalKm,
                    s.nextMileage, s.label);
        }
        System.out.println();
        System.out.println("狀態說明：正常＝剩餘超過預警值；即將到期＝已進入預警里程；逾期＝超過建議里程。");
        pause();
    }

    private static ItemStatus statusOf(MaintenanceItem item) {
        int next = item.lastMileage + item.intervalKm;
        int remaining = next - motorcycle.currentMileage;
        if (remaining < 0) return new ItemStatus(next, remaining, true, "⚠ 逾期 " + (-remaining) + " km");
        if (remaining == 0) return new ItemStatus(next, 0, true, "⚠ 現在應保養");
        if (remaining <= item.warningKm) return new ItemStatus(next, remaining, false, "△ 剩 " + remaining + " km");
        return new ItemStatus(next, remaining, false, "✓ 正常（剩 " + remaining + " km）");
    }

    private static void updateMileage() {
        title("更新目前里程");
        System.out.printf("目前紀錄：%,d km%n", motorcycle.currentMileage);
        int value = readInt("請輸入新的總里程：", motorcycle.currentMileage, 2_000_000);
        motorcycle.currentMileage = value;
        saveData();
        success("目前里程已更新為 " + value + " km。");
        showDueSummary();
    }

    private static void showDueSummary() {
        List<MaintenanceItem> due = items.stream()
                .filter(i -> statusOf(i).remaining <= i.warningKm)
                .sorted(Comparator.comparingInt(i -> statusOf(i).remaining))
                .collect(Collectors.toList());
        if (due.isEmpty()) {
            System.out.println("目前沒有即將到期的保養項目。");
            return;
        }
        System.out.println("\n需要注意的項目：");
        for (MaintenanceItem item : due) {
            System.out.println("- " + item.name + "：" + statusOf(item).label);
        }
    }

    private static void addMaintenanceRecord() {
        title("新增保養紀錄");
        MaintenanceItem item = selectItem("要記錄哪個保養項目？");
        if (item == null) return;

        LocalDate date = readDate("保養日期（Enter 使用今天 " + LocalDate.now() + "）：", LocalDate.now());
        int mileage = readInt("保養時的里程：", 0, 2_000_000);
        if (mileage > motorcycle.currentMileage) {
            boolean update = readYesNo("此里程高於目前里程，要一併更新目前里程嗎？（Y/N）：");
            if (update) motorcycle.currentMileage = mileage;
        }
        double cost = readDouble("保養費用（沒有費用請輸入 0）：", 0, 1_000_000);
        String shop = readOptional("保養店家（可直接 Enter）：");
        String note = readOptional("備註（可直接 Enter）：");

        int id = records.stream().mapToInt(r -> r.id).max().orElse(0) + 1;
        records.add(new MaintenanceRecord(id, item.id, item.name, date, mileage, cost, shop, note));
        if (mileage >= item.lastMileage) item.lastMileage = mileage;
        saveData();
        success("已新增「" + item.name + "」保養紀錄。下次建議里程："
                + (item.lastMileage + item.intervalKm) + " km");
    }

    private static void historyMenu() {
        while (true) {
            title("保養歷史紀錄");
            System.out.println("1. 查看全部紀錄");
            System.out.println("2. 依保養項目篩選");
            System.out.println("3. 依關鍵字搜尋");
            System.out.println("4. 刪除錯誤紀錄");
            System.out.println("0. 返回主選單");
            int choice = readInt("請選擇：", 0, 4);
            if (choice == 0) return;
            switch (choice) {
                case 1 -> printRecords(records);
                case 2 -> {
                    MaintenanceItem item = selectItem("選擇保養項目：");
                    if (item != null) printRecords(records.stream()
                            .filter(r -> r.itemId == item.id).collect(Collectors.toList()));
                }
                case 3 -> {
                    String keyword = readRequired("請輸入關鍵字：").toLowerCase(Locale.ROOT);
                    printRecords(records.stream().filter(r -> r.searchText().contains(keyword))
                            .collect(Collectors.toList()));
                }
                case 4 -> deleteRecord();
            }
        }
    }

    private static void printRecords(List<MaintenanceRecord> source) {
        title("紀錄清單");
        if (source.isEmpty()) {
            System.out.println("目前沒有符合的紀錄。");
            pause();
            return;
        }
        List<MaintenanceRecord> sorted = new ArrayList<>(source);
        sorted.sort(Comparator.comparing((MaintenanceRecord r) -> r.date).reversed()
                .thenComparing(Comparator.comparingInt((MaintenanceRecord r) -> r.id).reversed()));
        for (MaintenanceRecord r : sorted) {
            System.out.printf("#%d｜%s｜%s｜%,d km｜$%,.0f%n",
                    r.id, r.date, r.itemName, r.mileage, r.cost);
            if (!r.shop.isBlank()) System.out.println("    店家：" + r.shop);
            if (!r.note.isBlank()) System.out.println("    備註：" + r.note);
        }
        pause();
    }

    private static void deleteRecord() {
        if (records.isEmpty()) { error("目前沒有紀錄可刪除。"); return; }
        int id = readInt("請輸入要刪除的紀錄編號：", 1, Integer.MAX_VALUE);
        MaintenanceRecord target = records.stream().filter(r -> r.id == id).findFirst().orElse(null);
        if (target == null) { error("找不到此紀錄。"); return; }
        System.out.printf("將刪除 #%d %s %s（%,d km）%n", target.id, target.date, target.itemName, target.mileage);
        if (!readYesNo("確定刪除嗎？（Y/N）：")) return;
        records.remove(target);
        recalculateLastMileage(target.itemId);
        saveData();
        success("紀錄已刪除，該項目的上次保養里程已重新計算。");
    }

    private static void recalculateLastMileage(int itemId) {
        MaintenanceItem item = findItem(itemId);
        if (item == null) return;
        int latest = records.stream().filter(r -> r.itemId == itemId)
                .mapToInt(r -> r.mileage).max().orElse(0);
        item.lastMileage = latest;
    }

    private static void showCostStatistics() {
        title("保養費用統計");
        if (records.isEmpty()) { System.out.println("尚無保養紀錄。"); pause(); return; }
        double total = records.stream().mapToDouble(r -> r.cost).sum();
        int thisYear = LocalDate.now().getYear();
        YearMonth thisMonth = YearMonth.now();
        double yearTotal = records.stream().filter(r -> r.date.getYear() == thisYear).mapToDouble(r -> r.cost).sum();
        double monthTotal = records.stream().filter(r -> YearMonth.from(r.date).equals(thisMonth)).mapToDouble(r -> r.cost).sum();
        System.out.printf("累計總費用：$%,.0f%n", total);
        System.out.printf("%d 年費用：$%,.0f%n", thisYear, yearTotal);
        System.out.printf("%s 費用：$%,.0f%n%n", thisMonth, monthTotal);

        System.out.println("依保養項目統計：");
        Map<String, Double> byItem = new TreeMap<>();
        for (MaintenanceRecord r : records) byItem.merge(r.itemName, r.cost, Double::sum);
        byItem.entrySet().stream().sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .forEach(e -> System.out.printf("- %-16s $%,.0f%n", e.getKey(), e.getValue()));

        Optional<MaintenanceRecord> max = records.stream().max(Comparator.comparingDouble(r -> r.cost));
        max.ifPresent(r -> System.out.printf("%n單筆最高：%s %s，$%,.0f%n", r.date, r.itemName, r.cost));
        pause();
    }

    private static void manageItems() {
        while (true) {
            title("管理保養項目與週期");
            listItems();
            System.out.println("\n1. 修改保養週期／預警值");
            System.out.println("2. 修改上次保養里程");
            System.out.println("3. 新增自訂保養項目");
            System.out.println("4. 刪除自訂保養項目");
            System.out.println("5. 恢復常用建議週期");
            System.out.println("0. 返回主選單");
            int choice = readInt("請選擇：", 0, 5);
            if (choice == 0) return;
            switch (choice) {
                case 1 -> editInterval();
                case 2 -> editLastMileage();
                case 3 -> addCustomItem();
                case 4 -> deleteCustomItem();
                case 5 -> restoreDefaultIntervals();
            }
        }
    }

    private static void listItems() {
        System.out.printf("%-3s %-16s %10s %10s %10s%n", "ID", "名稱", "週期", "預警", "上次里程");
        line('-', 58);
        for (MaintenanceItem i : items) {
            System.out.printf("%-3d %-16s %,8d km %,8d km %,8d km%s%n",
                    i.id, cut(i.name, 14), i.intervalKm, i.warningKm, i.lastMileage, i.custom ? "（自訂）" : "");
        }
    }

    private static void editInterval() {
        MaintenanceItem item = selectItem("選擇要修改的項目：");
        if (item == null) return;
        int interval = readInt("新的保養週期（km）：", 1, 200_000);
        int warning = readInt("提前多少公里提醒：", 0, interval);
        item.intervalKm = interval;
        item.warningKm = warning;
        saveData();
        success("「" + item.name + "」週期已更新。");
    }

    private static void editLastMileage() {
        MaintenanceItem item = selectItem("選擇要修改的項目：");
        if (item == null) return;
        item.lastMileage = readInt("上次保養里程：", 0, motorcycle.currentMileage);
        saveData();
        success("上次保養里程已更新。");
    }

    private static void addCustomItem() {
        String name = readRequired("自訂項目名稱：");
        if (items.stream().anyMatch(i -> i.name.equalsIgnoreCase(name))) {
            error("已有相同名稱的項目。"); return;
        }
        int interval = readInt("建議週期（km）：", 1, 200_000);
        int warning = readInt("提前提醒里程（km）：", 0, interval);
        int last = readInt("上次保養里程（從未保養可輸入 0）：", 0, motorcycle.currentMileage);
        int id = items.stream().mapToInt(i -> i.id).max().orElse(0) + 1;
        items.add(new MaintenanceItem(id, name, interval, warning, last, true));
        saveData();
        success("已新增自訂項目「" + name + "」。");
    }

    private static void deleteCustomItem() {
        List<MaintenanceItem> custom = items.stream().filter(i -> i.custom).collect(Collectors.toList());
        if (custom.isEmpty()) { error("目前沒有自訂項目可刪除。"); return; }
        custom.forEach(i -> System.out.println(i.id + ". " + i.name));
        int id = readInt("請輸入要刪除的自訂項目 ID：", 1, Integer.MAX_VALUE);
        MaintenanceItem item = custom.stream().filter(i -> i.id == id).findFirst().orElse(null);
        if (item == null) { error("找不到此自訂項目。"); return; }
        long count = records.stream().filter(r -> r.itemId == id).count();
        if (count > 0) {
            error("此項目有 " + count + " 筆歷史紀錄，為避免資料遺失，無法刪除。"); return;
        }
        if (readYesNo("確定刪除「" + item.name + "」嗎？（Y/N）：")) {
            items.remove(item); saveData(); success("自訂項目已刪除。");
        }
    }

    private static void restoreDefaultIntervals() {
        if (!readYesNo("這會重設內建項目的週期，但不會刪除紀錄。確定嗎？（Y/N）：")) return;
        Map<Integer, int[]> defaults = defaultIntervalMap();
        for (MaintenanceItem item : items) {
            int[] values = defaults.get(item.id);
            if (values != null && !item.custom) {
                item.intervalKm = values[0]; item.warningKm = values[1];
            }
        }
        saveData(); success("內建項目已恢復常用建議週期。");
    }

    private static void manageMotorcycle() {
        title("管理機車資料");
        System.out.println("目前車牌：" + motorcycle.plate);
        System.out.println("目前車款：" + motorcycle.model);
        System.out.printf("目前里程：%,d km%n", motorcycle.currentMileage);
        System.out.println("\n1. 修改車牌　2. 修改車款　3. 修改目前里程　0. 返回");
        int choice = readInt("請選擇：", 0, 3);
        switch (choice) {
            case 1 -> motorcycle.plate = readRequired("新車牌：").toUpperCase(Locale.ROOT);
            case 2 -> motorcycle.model = readRequired("新車款：");
            case 3 -> motorcycle.currentMileage = readInt("新里程：", 0, 2_000_000);
            default -> { return; }
        }
        saveData(); success("機車資料已更新。");
    }

    private static void exportCsv() {
        String filename = "maintenance-report-" + LocalDate.now() + ".csv";
        Path path = Paths.get(filename);
        try (BufferedWriter writer = Files.newBufferedWriter(path, StandardCharsets.UTF_8)) {
            writer.write('\ufeff');
            writer.write("紀錄編號,日期,保養項目,里程(km),費用,店家,備註");
            writer.newLine();
            for (MaintenanceRecord r : records) {
                writer.write(r.id + "," + csv(r.date.toString()) + "," + csv(r.itemName) + ","
                        + r.mileage + "," + r.cost + "," + csv(r.shop) + "," + csv(r.note));
                writer.newLine();
            }
            success("CSV 已匯出：" + path.toAbsolutePath());
            System.out.println("可以使用 Excel 或 Google 試算表開啟。");
        } catch (IOException e) {
            error("匯出失敗：" + e.getMessage());
        }
    }

    private static String csv(String value) {
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    private static void showHelp() {
        title("系統說明");
        System.out.println("【基本操作】");
        System.out.println("1. 第一次使用，先到「管理機車資料」輸入車牌、車款和目前里程。");
        System.out.println("2. 到「管理保養項目」輸入各項目的上次保養里程。");
        System.out.println("3. 之後定期更新目前里程，儀表板會自動計算剩餘里程與逾期狀態。");
        System.out.println("4. 完成保養後新增紀錄，系統會同步更新該項目的上次保養里程。");
        System.out.println("5. 資料會自動儲存在程式所在資料夾的 " + DATA_FILE + "。");
        System.out.println("\n【注意】");
        System.out.println("本系統的預設週期是一般示範值。實際週期應以原廠使用手冊、機油規格、");
        System.out.println("騎乘環境與技師建議為準；若出現異音、漏油或操控異常，不要等里程到期才檢查。");
        pause();
    }

    private static MaintenanceItem selectItem(String prompt) {
        System.out.println(prompt);
        listItems();
        int id = readInt("輸入項目 ID（0 取消）：", 0, Integer.MAX_VALUE);
        if (id == 0) return null;
        MaintenanceItem item = findItem(id);
        if (item == null) error("找不到此保養項目。");
        return item;
    }

    private static MaintenanceItem findItem(int id) {
        return items.stream().filter(i -> i.id == id).findFirst().orElse(null);
    }

    private static void loadData() {
        Path path = Paths.get(DATA_FILE);
        if (!Files.exists(path)) {
            items.addAll(defaultItems());
            return;
        }
        try {
            List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
            items.clear(); records.clear();
            for (String line : lines) {
                if (line.isBlank() || line.startsWith("#")) continue;
                String[] p = line.split("\\|", -1);
                switch (p[0]) {
                    case "BIKE" -> motorcycle = new Motorcycle(decode(p[1]), decode(p[2]), Integer.parseInt(p[3]));
                    case "ITEM" -> items.add(new MaintenanceItem(Integer.parseInt(p[1]), decode(p[2]),
                            Integer.parseInt(p[3]), Integer.parseInt(p[4]), Integer.parseInt(p[5]), Boolean.parseBoolean(p[6])));
                    case "RECORD" -> records.add(new MaintenanceRecord(Integer.parseInt(p[1]), Integer.parseInt(p[2]),
                            decode(p[3]), LocalDate.parse(p[4]), Integer.parseInt(p[5]), Double.parseDouble(p[6]),
                            decode(p[7]), decode(p[8])));
                    default -> { }
                }
            }
            if (items.isEmpty()) items.addAll(defaultItems());
        } catch (Exception e) {
            error("資料檔讀取失敗，已使用預設資料。原檔案不會被覆蓋。原因：" + e.getMessage());
            items.clear(); records.clear(); items.addAll(defaultItems());
        }
    }

    private static void saveData() {
        Path target = Paths.get(DATA_FILE);
        Path temp = Paths.get(DATA_FILE + ".tmp");
        try (BufferedWriter writer = Files.newBufferedWriter(temp, StandardCharsets.UTF_8)) {
            writer.write("# Motorcycle Maintenance System Data v1"); writer.newLine();
            writer.write("BIKE|" + encode(motorcycle.plate) + "|" + encode(motorcycle.model) + "|" + motorcycle.currentMileage);
            writer.newLine();
            for (MaintenanceItem i : items) {
                writer.write("ITEM|" + i.id + "|" + encode(i.name) + "|" + i.intervalKm + "|"
                        + i.warningKm + "|" + i.lastMileage + "|" + i.custom);
                writer.newLine();
            }
            for (MaintenanceRecord r : records) {
                writer.write("RECORD|" + r.id + "|" + r.itemId + "|" + encode(r.itemName) + "|" + r.date
                        + "|" + r.mileage + "|" + r.cost + "|" + encode(r.shop) + "|" + encode(r.note));
                writer.newLine();
            }
        } catch (IOException e) {
            error("資料儲存失敗：" + e.getMessage()); return;
        }
        try {
            try {
                Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            error("資料檔更新失敗：" + e.getMessage());
        }
    }

    private static String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(String value) {
        if (value.isEmpty()) return "";
        return new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8);
    }

    private static List<MaintenanceItem> defaultItems() {
        return new ArrayList<>(List.of(
                new MaintenanceItem(1, "機油", 1000, 200, 0, false),
                new MaintenanceItem(2, "齒輪油", 3000, 500, 0, false),
                new MaintenanceItem(3, "輪胎檢查", 5000, 500, 0, false),
                new MaintenanceItem(4, "空氣濾清器", 5000, 500, 0, false),
                new MaintenanceItem(5, "火星塞", 10000, 1000, 0, false),
                new MaintenanceItem(6, "煞車系統", 3000, 500, 0, false),
                new MaintenanceItem(7, "傳動皮帶", 12000, 1500, 0, false),
                new MaintenanceItem(8, "電瓶檢查", 6000, 1000, 0, false)
        ));
    }

    private static Map<Integer, int[]> defaultIntervalMap() {
        Map<Integer, int[]> map = new HashMap<>();
        for (MaintenanceItem i : defaultItems()) map.put(i.id, new int[]{i.intervalKm, i.warningKm});
        return map;
    }

    private static int readInt(String prompt, int min, int max) {
        while (true) {
            System.out.print(prompt + " ");
            String text = INPUT.nextLine().trim().replace(",", "");
            try {
                int value = Integer.parseInt(text);
                if (value >= min && value <= max) return value;
            } catch (NumberFormatException ignored) { }
            System.out.printf("請輸入 %d～%d 之間的整數。%n", min, max);
        }
    }

    private static double readDouble(String prompt, double min, double max) {
        while (true) {
            System.out.print(prompt + " ");
            String text = INPUT.nextLine().trim().replace(",", "");
            try {
                double value = Double.parseDouble(text);
                if (Double.isFinite(value) && value >= min && value <= max) return value;
            } catch (NumberFormatException ignored) { }
            System.out.printf("請輸入 %.0f～%.0f 之間的數字。%n", min, max);
        }
    }

    private static LocalDate readDate(String prompt, LocalDate defaultValue) {
        while (true) {
            System.out.print(prompt + " ");
            String text = INPUT.nextLine().trim();
            if (text.isEmpty()) return defaultValue;
            try {
                LocalDate date = LocalDate.parse(text, DATE_FORMAT);
                if (!date.isAfter(LocalDate.now().plusDays(1))) return date;
                System.out.println("日期不能晚於明天。");
            } catch (DateTimeParseException e) {
                System.out.println("日期格式錯誤，請輸入 yyyy-MM-dd，例如 2026-09-18。");
            }
        }
    }

    private static boolean readYesNo(String prompt) {
        while (true) {
            System.out.print(prompt + " ");
            String text = INPUT.nextLine().trim().toLowerCase(Locale.ROOT);
            if (text.equals("y") || text.equals("yes") || text.equals("是")) return true;
            if (text.equals("n") || text.equals("no") || text.equals("否")) return false;
            System.out.println("請輸入 Y 或 N。");
        }
    }

    private static String readRequired(String prompt) {
        while (true) {
            System.out.print(prompt + " ");
            String text = INPUT.nextLine().trim();
            if (!text.isEmpty()) return text;
            System.out.println("此欄位不能空白。");
        }
    }

    private static String readOptional(String prompt) {
        System.out.print(prompt + " ");
        return INPUT.nextLine().trim();
    }

    private static void pause() {
        System.out.print("\n按 Enter 返回……");
        INPUT.nextLine();
    }

    private static void title(String text) {
        System.out.println(); line('=', 62); System.out.println("【" + text + "】"); line('=', 62);
    }

    private static void line(char c, int length) {
        System.out.println(String.valueOf(c).repeat(length));
    }

    private static void success(String message) { System.out.println("✓ " + message); }
    private static void error(String message) { System.out.println("⚠ " + message); }
    private static String cut(String value, int max) { return value.length() <= max ? value : value.substring(0, max - 1) + "…"; }

    private static class Motorcycle {
        String plate;
        String model;
        int currentMileage;
        Motorcycle(String plate, String model, int currentMileage) {
            this.plate = plate; this.model = model; this.currentMileage = currentMileage;
        }
    }

    private static class MaintenanceItem {
        int id;
        String name;
        int intervalKm;
        int warningKm;
        int lastMileage;
        boolean custom;
        MaintenanceItem(int id, String name, int intervalKm, int warningKm, int lastMileage, boolean custom) {
            this.id = id; this.name = name; this.intervalKm = intervalKm; this.warningKm = warningKm;
            this.lastMileage = lastMileage; this.custom = custom;
        }
    }

    private static class MaintenanceRecord {
        int id;
        int itemId;
        String itemName;
        LocalDate date;
        int mileage;
        double cost;
        String shop;
        String note;
        MaintenanceRecord(int id, int itemId, String itemName, LocalDate date, int mileage,
                          double cost, String shop, String note) {
            this.id = id; this.itemId = itemId; this.itemName = itemName; this.date = date;
            this.mileage = mileage; this.cost = cost; this.shop = shop; this.note = note;
        }
        String searchText() {
            return (itemName + " " + date + " " + mileage + " " + cost + " " + shop + " " + note)
                    .toLowerCase(Locale.ROOT);
        }
    }

    private static class ItemStatus {
        int nextMileage;
        int remaining;
        boolean overdue;
        String label;
        ItemStatus(int nextMileage, int remaining, boolean overdue, String label) {
            this.nextMileage = nextMileage; this.remaining = remaining; this.overdue = overdue; this.label = label;
        }
    }
}
