# Build stage
FROM golang:1.24 as builder

WORKDIR /app
COPY backend/ ./backend

WORKDIR /app/backend
RUN go build -o FoodStats

# Final image
FROM debian:bullseye-slim

WORKDIR /app
COPY --from=builder /app/backend/FoodStats .

ENV PORT=8080
EXPOSE 8080

CMD ["./FoodStats"]
