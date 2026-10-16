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

variable "ssh_allowed_cidr" {
  description = "Your public IPv4 address in CIDR notation, restricted to /32"
  type        = string

  validation {
    condition     = can(cidrhost(var.ssh_allowed_cidr, 0)) && endswith(var.ssh_allowed_cidr, "/32")
    error_message = "Provide a valid IPv4 address followed by /32, for example 203.0.113.10/32."
  }
}

variable "public_key_path" {
  description = "Path to the SSH public key used for EC2 access"
  type        = string
  default     = "/home/sachintha/.ssh/aws-devops-automation.pub"
}
