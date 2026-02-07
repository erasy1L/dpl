FROM golang:alpine AS builder

LABEL stage=gobuilder

ENV CGO_ENABLED=0

RUN apk update --no-cache && apk add --no-cache tzdata

WORKDIR /build

COPY go.mod go.sum ./
COPY pkg ./pkg

COPY internal ./internal
COPY cmd ./cmd

RUN go build -ldflags="-s -w" -o ./server ./cmd/main.go

FROM scratch

ENV TZ=Asia/Aqtobe

WORKDIR /server
COPY --from=builder /build/server ./server

EXPOSE 3030

CMD ["./server"]