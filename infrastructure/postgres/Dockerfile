FROM postgres:16

# Install build dependencies for Apache AGE and pgvector
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    git \
    postgresql-server-dev-16 \
    flex \
    bison \
    postgresql-16-pgvector \
    && rm -rf /var/lib/apt/lists/*

# Clone and compile Apache AGE v1.5.0 for PostgreSQL 16
RUN git clone --branch release/PG16/1.5.0 https://github.com/apache/age.git /tmp/age \
    && cd /tmp/age \
    && make install \
    && rm -rf /tmp/age

# Preload the Apache AGE and pgvector libraries in PostgreSQL
RUN echo "shared_preload_libraries = 'age,vector'" >> /usr/share/postgresql/postgresql.conf.sample

