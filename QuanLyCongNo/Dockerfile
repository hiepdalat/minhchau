# 1. Base image
FROM node:18

# 2. Tạo thư mục làm việc trong container
WORKDIR /app

# 3. Copy file cấu hình vào container
COPY package*.json ./

# 4. Cài đặt gói npm (dùng npm install thay vì npm ci)
RUN npm install

# 5. Copy toàn bộ mã nguồn vào container
COPY . .

# 6. Expose port Railway sẽ dùng (thường là 3000 hoặc PORT biến môi trường)
EXPOSE 3000

# 7. Lệnh chạy server
CMD ["npm", "start"]
