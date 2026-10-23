
const { test, expect } = require('@playwright/test');

// 每次測試前開啟網站
test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5000');
});

// 測試 1：網站首頁正常顯示
test('網站首頁正常顯示', async ({ page }) => {
    await expect(
        page.getByRole('heading', {
            name: '大學課程管理系統'
        })
    ).toBeVisible();

    await expect(
        page.getByRole('heading', {
            name: '學生登入'
        })
    ).toBeVisible();
});

// 測試 2：學生登入成功
test('學生登入成功', async ({ page }) => {
    await page.locator('#username').fill('student01');
    await page.locator('#password').fill('123456');

    await page.getByRole('button', {
        name: '登入'
    }).click();

    await expect(
        page.getByRole('heading', {
            name: '課程列表'
        })
    ).toBeVisible();

    await expect(
        page.locator('#message')
    ).toHaveText('登入成功');
});

// 測試 3：錯誤密碼登入失敗
test('錯誤密碼登入失敗', async ({ page }) => {
    await page.locator('#username').fill('student01');
    await page.locator('#password').fill('wrong');

    await page.getByRole('button', {
        name: '登入'
    }).click();

    await expect(
        page.locator('#message')
    ).toHaveText('帳號或密碼錯誤');

    await expect(
        page.locator('#loginSection')
    ).toBeVisible();
});

// 測試 4：學生可以正常選課
test('學生可以正常選課', async ({ page }) => {
    await page.locator('#username').fill('student01');
    await page.locator('#password').fill('123456');

    await page.getByRole('button', {
        name: '登入'
    }).click();

    const course = page.locator('#courseList .course')
        .filter({ hasText: '計算機結構' });

    await course.getByRole('button', {
        name: '選課'
    }).click();

    await expect(
        page.locator('#message')
    ).toHaveText('選課成功');

    await expect(
        page.locator('#selectedCourses')
    ).toContainText('計算機結構');
});

// 測試 5：學生可以正常退選
test('學生可以正常退選', async ({ page }) => {
    await page.locator('#username').fill('student01');
    await page.locator('#password').fill('123456');

    await page.getByRole('button', {
        name: '登入'
    }).click();

    const course = page.locator('#courseList .course')
        .filter({ hasText: '電路學' });

    await course.getByRole('button', {
        name: '選課'
    }).click();

    await expect(
        page.locator('#selectedCourses')
    ).toContainText('電路學');

    const selected = page.locator('#selectedCourses .course')
        .filter({ hasText: '電路學' });

    await selected.getByRole('button', {
        name: '退選'
    }).click();

    await expect(
        page.locator('#message')
    ).toHaveText('退選成功');

    await expect(
        page.locator('#selectedCourses')
    ).not.toContainText('電路學');
});

// 測試 6：學生可以正常登出
test('學生可以正常登出', async ({ page }) => {
    await page.locator('#username').fill('student01');
    await page.locator('#password').fill('123456');

    await page.getByRole('button', {
        name: '登入'
    }).click();

    await page.getByRole('button', {
        name: '登出'
    }).click();

    await expect(
        page.locator('#loginSection')
    ).toBeVisible();

    await expect(
        page.locator('#courseSection')
    ).toBeHidden();

    await expect(
        page.locator('#message')
    ).toHaveText('已登出');
});
