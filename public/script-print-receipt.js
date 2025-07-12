document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const receiptId = urlParams.get('receiptId');

    const invoiceDateSpan = document.getElementById('invoiceDate');
    const customerNameSpan = document.getElementById('customerName');
    const customerAddressSpan = document.getElementById('customerAddress'); // Placeholder, since address is not in current data
    const invoiceItemsBody = document.getElementById('invoiceItems');
    const invoiceTotalSpan = document.getElementById('invoiceTotal');
    const amountInWordsSpan = document.getElementById('amountInWords');
    const sellerDateSpan = document.getElementById('sellerDate');

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
        return (result.trim() + ' đồng').replace(/\s+/g, ' '); // Remove extra spaces
    }


    async function loadReceiptDetails(id) {
        try {
            const response = await fetch(`/api/nhaphang/${id}`);
            if (response.ok) {
                const receipt = await response.json();
                console.log('Receipt data for printing:', receipt);

                const receiptDate = new Date(receipt.ngay);
                const formattedDate = receiptDate.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                invoiceDateSpan.textContent = formattedDate;
                customerNameSpan.textContent = receipt.daily; // Đại lý là người mua hàng trong ngữ cảnh này
                customerAddressSpan.textContent = "________________________________________________"; // Placeholder, update if address is available
                invoiceTotalSpan.textContent = formatCurrency(receipt.tongtien);
                amountInWordsSpan.textContent = numberToVietnameseWords(receipt.tongtien);
                sellerDateSpan.textContent = formattedDate; // Ngày bán hàng là ngày nhập hàng

                invoiceItemsBody.innerHTML = '';
                if (receipt.items && receipt.items.length > 0) {
                    receipt.items.forEach((item, index) => {
                        const row = invoiceItemsBody.insertRow();
                        row.innerHTML = `
                            <td>${index + 1}</td>
                            <td style="text-align: left;">${item.tenhang}</td>
                            <td>${item.soluong} ${item.dvt}</td>
                            <td>${formatCurrency(item.dongia)}</td>
                            <td>${formatCurrency(item.thanhtien)}</td>
                        `;
                    });
                } else {
                    const row = invoiceItemsBody.insertRow();
                    row.innerHTML = `<td colspan="5" style="text-align: center;">Không có mặt hàng nào trong phiếu này.</td>`;
                }

            } else if (response.status === 401) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); // Using alert here as it's a new page
                window.close(); // Close the print tab
                window.opener.location.href = '/index.html'; // Redirect main window
            } else {
                const errorData = await response.json();
                alert(`Lỗi khi tải chi tiết phiếu nhập: ${errorData.error || response.statusText}`);
                window.close();
            }
        } catch (error) {
            console.error('Lỗi mạng hoặc server khi tải chi tiết phiếu nhập:', error);
            alert('Lỗi kết nối đến server. Không thể tải hóa đơn.');
            window.close();
        }
    }

    if (receiptId) {
        loadReceiptDetails(receiptId);
    } else {
        alert('Không tìm thấy ID phiếu nhập. Vui lòng thử lại từ trang Nhập Hàng.');
        window.close();
    }
});
