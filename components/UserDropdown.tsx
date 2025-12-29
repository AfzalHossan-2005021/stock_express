'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button";
import { LogOut, Settings, Trash2, Lock } from "lucide-react";
import NavItems from "./NavItems";
import PasswordInputField from "./forms/PasswordInputField"
import { signOut, updatePassword } from "@/lib/actions/auth.actions";
import { deleteUserAccount } from "@/lib/actions/user.actions";
import { toast } from "sonner";

const UserDropdown = ({ user, initialStocks }: { user: User, initialStocks: StockWithWatchlistStatus[] }) => {
	const router = useRouter();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showUpdatePasswordDialog, setShowUpdatePasswordDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
		getValues,
	} = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>({
		mode: 'onBlur',
	})

	const handleSignOut = async () => {
		await signOut();
		router.push('/sign-in');
	}

	const handleUpdatePreferences = () => {
		router.push('/personalize');
	}

	const handleUpdatePassword = async (data: { newPassword: string; confirmPassword: string }) => {
		try {
			const result = await updatePassword({
				newPassword: data.newPassword,
				confirmPassword: data.confirmPassword,
			});

			if (result.success) {
				toast.success('Password updated', { description: 'Your password has been updated successfully.' });
				reset();
				setShowUpdatePasswordDialog(false);
			} else {
				toast.error('Update failed', { description: result.message || 'Failed to update password.' });
			}
		} catch (error) {
			console.error('Error updating password:', error);
			toast.error('Update failed', { description: 'An unexpected error occurred.' });
		}
	}

	const handleDeleteAccount = async () => {
		setIsDeleting(true);
		try {
			const result = await deleteUserAccount();
			
			if (result.success) {
				toast.success('Account deleted', { description: 'Your account has been deleted successfully.' });
				await signOut();
				window.location.href = '/sign-in';
			} else {
				toast.error('Delete failed', { description: result.message || 'Failed to delete account.' });
				setShowDeleteDialog(false);
			}
		} catch (error) {
			console.error('Error deleting account:', error);
			toast.error('Delete failed', { description: 'An unexpected error occurred.' });
			setShowDeleteDialog(false);
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="flex items-center gap-3 text-gray-4 hover:text-yellow-500">
						<Avatar className="w-8 h-8">
							<AvatarImage src="https://github.com/shadcn.png" />
							<AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
								{user.name[0]}
							</AvatarFallback>
						</Avatar>
						<div className="hidden md:flex flex-col items-start">
							<span className="text-base font-medium text-gray-400">{user.name}</span>
						</div>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="text-gray-400">
					<DropdownMenuLabel>
						<div className="flex relative items-center gap-3 py-2">
							<Avatar className="w-8 h-8">
								<AvatarImage src="https://github.com/shadcn.png" />
								<AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
									{user.name[0]}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col">
								<span className="text-base font-medium text-gray-400">{user.name}</span>
								<span className="text-sm text-gray-500">{user.email}</span>
							</div>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator className="bg-gray-600"/>
				<DropdownMenuItem onClick={handleUpdatePreferences} className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer">
					<Settings className="h-4 w-4 mr-2 hidden sm:block" />
					Update Preferences
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setShowUpdatePasswordDialog(true)} className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer">
					<Lock className="h-4 w-4 mr-2 hidden sm:block" />
					Update Password
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleSignOut} className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer">
					<LogOut className="h-4 w-4 mr-2 hidden sm:block" />
					Sign Out
				</DropdownMenuItem>
				<DropdownMenuSeparator className="bg-gray-600"/>
				<DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-500 text-md font-medium focus:bg-transparent focus:text-red-400 transition-colors cursor-pointer">
					<Trash2 className="h-4 w-4 mr-2 hidden sm:block" />
					Delete Account
				</DropdownMenuItem>
				<DropdownMenuSeparator className="hidden sm:block bg-gray-600"/>
				<nav className="sm:hidden">
					<NavItems initialStocks={initialStocks} />
				</nav>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={showUpdatePasswordDialog} onOpenChange={setShowUpdatePasswordDialog}>
				<DialogContent className="border-gray-700 bg-gray-900 sm:max-w-[400px]">
					<DialogHeader>
						<DialogTitle className="text-gray-100">Update Password</DialogTitle>
						<DialogDescription className="text-gray-400">
							Enter your current password and a new password below. Password must be at least 8 characters long.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit(handleUpdatePassword)} className="space-y-4">
						<PasswordInputField
							name="newPassword"
							label="New Password"
							placeholder="Enter new password"
							register={register}
							error={errors.newPassword}
							validation={{
								required: 'Password is required',
								minLength: { value: 8, message: 'Password must be at least 8 characters' },
								maxLength: { value: 128, message: 'Password must be no more than 128 characters' },
							}}
						/>
						<PasswordInputField
							name="confirmPassword"
							label="Confirm Password"
							placeholder="Confirm your password"
							register={register}
							error={errors.confirmPassword}
							validation={{
								required: 'Please confirm your password',
								validate: (value: string) =>
									value === getValues('newPassword') || 'Passwords do not match',
							}}
						/>
						<div className="flex gap-3 justify-end pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowUpdatePasswordDialog(false)}
								className="text-gray-400 border-gray-600 hover:bg-gray-800"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting}
								className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
							>
								{isSubmitting ? 'Updating...' : 'Update'}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent className="border-gray-700 bg-gray-900 sm:max-w-[400px]">
					<DialogHeader>
						<DialogTitle className="text-gray-100">Delete Account</DialogTitle>
						<DialogDescription className="text-gray-400">
							Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.
						</DialogDescription>
					</DialogHeader>
					<div className="flex gap-3 justify-end pt-4">
						<Button
							variant="outline"
							onClick={() => setShowDeleteDialog(false)}
							className="text-gray-400 border-gray-600 hover:bg-gray-800"
						>
							Cancel
						</Button>
						<Button 
							onClick={handleDeleteAccount}
							disabled={isDeleting}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{isDeleting ? 'Deleting...' : 'Delete'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

export default UserDropdown