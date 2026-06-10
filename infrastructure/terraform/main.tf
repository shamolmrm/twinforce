terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "twinforce-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# ─── VPC ────────────────────────────────────────────────────────────────────
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "twinforce-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false

  tags = local.common_tags
}

# ─── EKS ────────────────────────────────────────────────────────────────────
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "twinforce"
  cluster_version = "1.31"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    api = {
      min_size       = 2
      max_size       = 10
      desired_size   = 3
      instance_types = ["t3.medium"]
      labels         = { workload = "api" }
    }
    ai = {
      min_size       = 1
      max_size       = 5
      desired_size   = 2
      instance_types = ["c5.xlarge"]
      labels         = { workload = "ai" }
    }
  }

  tags = local.common_tags
}

# ─── RDS PostgreSQL ──────────────────────────────────────────────────────────
resource "aws_db_instance" "postgres" {
  identifier        = "twinforce-postgres"
  engine            = "postgres"
  engine_version    = "16.6"
  instance_class    = var.db_instance_class
  allocated_storage = 100
  storage_encrypted = true
  storage_type      = "gp3"

  db_name  = "twinforce"
  username = "postgres"
  password = var.db_password

  multi_az               = true
  backup_retention_period = 30
  deletion_protection    = true
  skip_final_snapshot    = false

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  tags = local.common_tags
}

resource "aws_db_subnet_group" "main" {
  name       = "twinforce-db-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "rds" {
  name   = "twinforce-rds-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }
}

# ─── ElastiCache Redis ────────────────────────────────────────────────────────
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "twinforce-redis"
  description          = "TwinForce Redis cluster"
  node_type            = "cache.t4g.medium"
  num_cache_clusters   = 2
  engine_version       = "7.1"
  automatic_failover_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  tags = local.common_tags
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "twinforce-redis-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "redis" {
  name   = "twinforce-redis-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }
}

# ─── S3 (MinIO alternative) ───────────────────────────────────────────────────
resource "aws_s3_bucket" "storage" {
  bucket = "twinforce-files-${var.environment}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_versioning" "storage" {
  bucket = aws_s3_bucket.storage.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

locals {
  common_tags = {
    Project     = "TwinForce"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
