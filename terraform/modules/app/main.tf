resource "aws_elastic_beanstalk_application" "app" {
  name        = "${var.app_name}-${var.environment}"
  description = "ProductiTask Application for ${var.environment} environment"
}

resource "aws_elastic_beanstalk_environment" "env" {
  name                = "${var.app_name}-${var.environment}"
  application         = aws_elastic_beanstalk_application.app.name
  solution_stack_name = "64bit Amazon Linux 2 v5.6.1 running Node.js 16"

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "EnvironmentType"
    value     = "LoadBalanced"
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = var.instance_type
  }

  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MinSize"
    value     = var.min_capacity
  }

  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MaxSize"
    value     = var.max_capacity
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NODE_ENV"
    value     = var.environment
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DATABASE_URL"
    value     = "postgres://${aws_db_instance.db.username}:${var.db_password}@${aws_db_instance.db.endpoint}/${aws_db_instance.db.name}"
  }
}

resource "aws_db_instance" "db" {
  identifier           = "${var.app_name}-${var.environment}"
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "14.5"
  instance_class       = "db.t3.micro"
  name                 = var.app_name
  username             = "dbadmin"
  password             = var.db_password
  parameter_group_name = "default.postgres14"
  skip_final_snapshot  = true
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.db_subnet_group.name
}

resource "aws_security_group" "db_sg" {
  name        = "${var.app_name}-${var.environment}-db-sg"
  description = "Security group for database"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [aws_elastic_beanstalk_environment.env.security_groups]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "${var.app_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids
}

# Route 53 and ACM certificate configuration for domain
resource "aws_route53_record" "app" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.selected[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_elastic_beanstalk_environment.env.cname
    zone_id                = data.aws_elastic_beanstalk_hosted_zone.current.id
    evaluate_target_health = true
  }
}

data "aws_route53_zone" "selected" {
  count = var.domain_name != "" ? 1 : 0
  name  = join(".", slice(split(".", var.domain_name), 1, length(split(".", var.domain_name))))
}

data "aws_elastic_beanstalk_hosted_zone" "current" {}

# Output the URL of the application
output "app_url" {
  value = var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_elastic_beanstalk_environment.env.cname}"
}

# Output the database endpoint
output "database_endpoint" {
  value = aws_db_instance.db.endpoint
}