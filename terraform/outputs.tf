output "vpc_id" {
  description = "ID of the project VPC"
  value       = aws_vpc.main.id
}

output "ec2_instance_id" {
  description = "ID of the EC2 web server"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "Public IP address of the EC2 web server"
  value       = aws_instance.web.public_ip
}
