variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The environment (production, staging, etc.)"
  type        = string
}

variable "app_name" {
  description = "The name of the application"
  type        = string
  default     = "productitask"
}

variable "domain_name" {
  description = "The domain name for the application"
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "The availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "db_password" {
  description = "The password for the database"
  type        = string
  sensitive   = true
}

variable "instance_type" {
  description = "The EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_capacity" {
  description = "The minimum number of instances in the auto scaling group"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "The maximum number of instances in the auto scaling group"
  type        = number
  default     = 5
}

variable "desired_capacity" {
  description = "The desired number of instances in the auto scaling group"
  type        = number
  default     = 2
}