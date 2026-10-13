variable "aws_region" {
  description = "AWS region where project resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name used to identify project resources"
  type        = string
  default     = "aws-devops-automation"
}

variable "instance_type" {
  description = "EC2 instance type for the website server"
  type        = string
  default     = "t3.micro"
}
