document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dailyName = urlParams.get('daily');
    const dateParam = urlParams.get('date'); // YYYY-MM-DD format

    const invoiceDateSpan = document.getElementById('invoiceDate');
    const dailyNameSpan = document.getElementById('dailyName'); // Đã đổi từ customerNameSpan
    const dailyAddressSpan = document.getElementById('dailyAddress'); // Đã đổi từ customerAddressSpan
    const invoiceItemsBody = document.getElementById('invoiceItems');
    const invoiceTotalSpan = document.getElementById('invoiceTotal');
    const amountInWordsSpan = document.getElementById('amountInWords');
    const importerDateSpan = document.getElementById('importerDate'); // Đã đổi từ sellerDateSpan

    /**
     * Formats a number as currency (Vietnamese Dong).
     * @param {number} amount - The number to format.
     * @returns {string} - Formatted currency string.
     */
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    /**
     * Converts a number to Vietnamese words.
     * This is a simplified version and might not handle all edge cases perfectly.
     * For a robust solution, consider a dedicated library.
     * @param {number} num - The number to convert.
     * @returns {string} - The number in Vietnamese words.
     */
    function numberToVietnameseWords(num) {
        const units = ['', 'nghìn', 'triệu', 'tỷ'];
        const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
        const teens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
        const ones = ['', 'một', 'hai', 'ba', 'bốn', 'lăm', 'sáu', 'bảy', 'tám', 'chín'];

        function readThreeDigits(n) {
            let s = '';
            const h = Math.floor(n / 100);
            const t = Math.floor((n % 100) / 10);
            const o = n % 10;

            if (h > 0) {
                s += digits[h] + ' trăm ';
            }
            if (t > 1) {
                s += teens[t] + ' ';
                if (o === 1) s += 'mốt ';
                else if (o === 5) s += 'lăm ';
                else s += digits[o] + ' ';
            } else if (t === 1) {
                s += 'mười ';
                if (o === 5) s += 'lăm ';
                else s += digits[o] + ' ';
            } else {
                if (h > 0 && (o > 0 || t > 0)) s += 'linh ';
                if (o > 0) s += digits[o] + ' ';
            }
            return s.trim();
        }

        if (num === 0) return 'không đồng';
        let result = '';
        let i = 0;
        let tempNum = Math.abs(num);

        while (tempNum > 0) {
            const segment = tempNum % 1000;
            if (segment > 0) {
                let segmentWords = readThreeDigits(segment);
                result = segmentWords + ' ' + units[i] + ' ' + result;
            }
            tempNum = Math.floor(tempNum / 1000);
            i++;
        }
        return (result.trim() + ' đồng').replace(/\s+/g, ' ');
    }


    async function loadReceiptDetailsByDailyAndDate(daily, date) {
        try {
            // Chuyển đổi ngày YYYY-MM-DD thành YYYY-MM cho tham số month của API
            const month = date.substring(0, 7); // "YYYY-MM"

            const response = await fetch(`/api/nhaphang?daily=${encodeURIComponent(daily)}&month=${encodeURIComponent(month)}`);
            if (response.ok) {
                const receipts = await response.json();
                console.log('Filtered receipts data for printing:', receipts);

                // Lọc thêm một lần nữa ở client để đảm bảo chính xác ngày
                const filteredReceipts = receipts.filter(r => {
                    const rDate = new Date(r.ngay).toISOString().split('T')[0];
                    return rDate === date;
                });

                if (filteredReceipts.length === 0) {
                    alert('Không tìm thấy phiếu nhập nào cho đại lý và ngày này.');
                    window.close();
                    return;
                }

                // Lấy thông tin từ phiếu nhập đầu tiên (hoặc bất kỳ phiếu nào trong danh sách)
                const firstReceipt = filteredReceipts[0];
                const receiptDate = new Date(firstReceipt.ngay);
                const formattedDate = receiptDate.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                invoiceDateSpan.textContent = formattedDate;
                dailyNameSpan.textContent = daily; // Tên đại lý từ URL
                dailyAddressSpan.textContent = "________________________________________________"; // Placeholder
                importerDateSpan.textContent = formattedDate; // Ngày nhập hàng

                invoiceItemsBody.innerHTML = '';
                let totalAmountForDisplay = 0;
                let itemCounter = 0;

                filteredReceipts.forEach(receipt => {
                    receipt.items.forEach(item => {
                        itemCounter++;
                        const row = invoiceItemsBody.insertRow();
                        row.innerHTML = `
                            <td>${itemCounter}</td>
                            <td style="text-align: left;">${item.tenhang}</td>
                            <td>${item.soluong} ${item.dvt}</td>
                            <td>${formatCurrency(item.dongia)}</td>
                            <td>${formatCurrency(item.thanhtien)}</td>
                        `;
                        totalAmountForDisplay += item.thanhtien;
                    });
                });

                invoiceTotalSpan.textContent = formatCurrency(totalAmountForDisplay);
                amountInWordsSpan.textContent = numberToVietnameseWords(totalAmountForDisplay);

            } else if (response.status === 401) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.close();
                window.opener.location.href = '/index.html';
            } else {
                const errorData = await response.json();
                alert(`Lỗi khi tải chi tiết phiếu nhập: ${errorData.error || response.statusText}`);
                window.close();
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc server khi tải chi tiết phiếu nhập:', error);
            alert('Lỗi kết nối đến server. Không thể tải phiếu nhập.');
            window.close();
        }
    }

    if (dailyName && dateParam) {
        loadReceiptDetailsByDailyAndDate(dailyName, dateParam);
    } else {
        alert('Không tìm thấy thông tin đại lý hoặc ngày. Vui lòng thử lại từ trang Nhập Hàng.');
        window.close();
    }
});
