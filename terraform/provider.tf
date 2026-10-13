provider "aws" {          #tells Terraform to use the AWS provider.
  region = var.aws_region #tells Terraform to use the Northern Virginia AWS region for regional resources.
}
