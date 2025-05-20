module "productitask" {
  source = "../../"

  environment      = "production"
  domain_name      = "productitask.example.com"
  db_password      = var.db_password
  instance_type    = "t3.small"
  min_capacity     = 2
  max_capacity     = 10
  desired_capacity = 3
}

output "app_url" {
  value = module.productitask.app_url
}