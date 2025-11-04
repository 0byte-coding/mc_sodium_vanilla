FROM ubuntu:latest

# Install necessary packages
RUN apt-get update && apt-get install -y \
    wget \
    git \
    curl \
    unzip \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Give ubuntu user (UID 1000) sudo access
RUN echo "ubuntu ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install Go
ENV GO_VERSION=1.23.2
RUN wget https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz && \
    rm go${GO_VERSION}.linux-amd64.tar.gz

# Add Go to PATH
ENV PATH=$PATH:/usr/local/go/bin:/home/ubuntu/go/bin
ENV GOPATH=/home/ubuntu/go

# Switch to ubuntu user (UID 1000)
USER ubuntu

# Install packwiz
RUN go install github.com/0byte-coding/packwiz@1d08a7ce1b74293c7b842413c8dd6c3a06afe285

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH=$PATH:/home/ubuntu/.bun/bin

WORKDIR /app

CMD ["tail", "-f", "/dev/null"]
