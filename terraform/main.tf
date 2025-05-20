terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"

  backend "s3" {
    # These values would be provided during CI/CD initialization
    # bucket = "productitask-terraform-state"
    # key    = "terraform.tfstate"
    # region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# Use environment-specific configuration
module "app" {
  source = "./modules/app"

  environment       = var.environment
  app_name          = var.app_name
  domain_name       = var.domain_name
  vpc_id            = module.network.vpc_id
  subnet_ids        = module.network.subnet_ids
  db_password       = var.db_password
  instance_type     = var.instance_type
  min_capacity      = var.min_capacity
  max_capacity      = var.max_capacity
  desired_capacity  = var.desired_capacity
}

module "network" {
  source = "./modules/network"

  environment = var.environment
  app_name    = var.app_name
  vpc_cidr    = var.vpc_cidr
  azs         = var.azs
}

# Output values
output "app_url" {
  description = "The URL of the deployed application"
  value       = module.app.app_url
}

output "database_endpoint" {
  description = "The endpoint of the database"
  value       = module.app.database_endpoint
  sensitive   = true
}