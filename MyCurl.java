import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class MyCurl {

    public static void main(String[] args) {

        // 检查有没有输入网址
        if (args.length == 0) {
            System.out.println("请输入网址");
            System.out.println("例如: java MyCurl https://example.com");
            return;
        }

        String url = args[0];

        try {
            // 建立 HTTP Client
            HttpClient client = HttpClient.newHttpClient();

            // 建立 GET 请求
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            System.out.println("正在连接: " + url);

            // 发送请求
            HttpResponse<String> response =
                    client.send(request, HttpResponse.BodyHandlers.ofString());

            // 显示结果
            System.out.println("HTTP 状态码: " + response.statusCode());
            System.out.println("------ 网页内容 ------");
            System.out.println(response.body());

        } catch (Exception e) {
            System.out.println("发生错误: " + e.getMessage());
        }
    }
}